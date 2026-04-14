import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type CheckoutItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type CheckoutAddress = {
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  pincode: string
}

type PaymentMethod = 'online' | 'cod'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authorization = req.headers.get('Authorization') ?? req.headers.get('authorization')
    const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

    let signedInUserId: string | null = null
    if (bearerToken && bearerToken.split('.').length === 3) {
      const { data: authUserData, error: authUserError } = await supabase.auth.getUser(bearerToken)
      if (!authUserError && authUserData.user) {
        signedInUserId = authUserData.user.id
      }
    }

    const {
      items,
      address,
      deliveryDate,
      deliveryTime,
      paymentMethod,
    } = await req.json() as {
      items: CheckoutItem[]
      address: CheckoutAddress
      deliveryDate: string
      deliveryTime: string
      paymentMethod?: PaymentMethod
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Cart is empty')
    }

    if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.pincode) {
      throw new Error('Incomplete delivery address')
    }

    if (!deliveryDate || !deliveryTime) {
      throw new Error('Delivery date and time are required')
    }

    const selectedPaymentMethod: PaymentMethod = paymentMethod === 'cod' ? 'cod' : 'online'

    const invalidItem = items.find((item) =>
      !item?.id ||
      !item?.name ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    )

    if (invalidItem) {
      throw new Error('Invalid cart item payload')
    }

    const totalAmount = items.reduce((sum: number, item) => sum + item.price * item.quantity * 100, 0)

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw new Error('Invalid order total')
    }

    const initialPaymentStatus = selectedPaymentMethod === 'cod' ? 'cod_pending' : 'pending'

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: signedInUserId,
        customer_name: address.name,
        customer_phone: address.phone,
        address_line1: address.line1,
        address_line2: address.line2 || null,
        city: address.city,
        state: '',
        pincode: address.pincode,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        total_amount: totalAmount,
        payment_method: selectedPaymentMethod,
        payment_status: initialPaymentStatus,
      })
      .select()
      .single()

    if (orderError) throw new Error(`DB insert failed: ${orderError.message}`)

    if (signedInUserId) {
      const { data: existingAddress } = await supabase
        .from('saved_addresses')
        .select('id')
        .eq('user_id', signedInUserId)
        .eq('address_line1', address.line1)
        .eq('city', address.city)
        .eq('pincode', address.pincode)
        .eq('phone', address.phone)
        .limit(1)

      if (!existingAddress || existingAddress.length === 0) {
        await supabase.from('saved_addresses').insert({
          user_id: signedInUserId,
          recipient_name: address.name,
          phone: address.phone,
          address_line1: address.line1,
          address_line2: address.line2 || null,
          city: address.city,
          state: '',
          pincode: address.pincode,
        })
      } else {
        await supabase
          .from('saved_addresses')
          .update({
            recipient_name: address.name,
            address_line2: address.line2 || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAddress[0].id)
      }
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_id: item.id,
      item_name: item.name,
      item_price: item.price * 100,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw new Error(`Items insert failed: ${itemsError.message}`)

    if (selectedPaymentMethod === 'cod') {
      return new Response(JSON.stringify({
        orderId: order.id,
        paymentMethod: 'cod',
        paymentStatus: initialPaymentStatus,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured')
    }

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: 'INR',
        receipt: order.id,
      }),
    })

    const razorpayOrder = await razorpayRes.json()
    if (!razorpayRes.ok) {
      throw new Error(`Razorpay error [${razorpayRes.status}]: ${JSON.stringify(razorpayOrder)}`)
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id)

    if (updateError) {
      throw new Error(`Order update failed: ${updateError.message}`)
    }

    return new Response(JSON.stringify({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: 'INR',
      paymentMethod: 'online',
      paymentStatus: initialPaymentStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
