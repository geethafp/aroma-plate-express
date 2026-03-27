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
  state: string
  pincode: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { items, address, deliveryDate, deliveryTime } = await req.json() as {
      items: CheckoutItem[]
      address: CheckoutAddress
      deliveryDate: string
      deliveryTime: string
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Cart is empty')
    }

    if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.state || !address?.pincode) {
      throw new Error('Incomplete delivery address')
    }

    if (!deliveryDate || !deliveryTime) {
      throw new Error('Delivery date and time are required')
    }

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

    // Calculate total in paise
    const totalAmount = items.reduce((sum: number, item) => sum + item.price * item.quantity * 100, 0)

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw new Error('Invalid order total')
    }

    // Insert order into DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: address.name,
        customer_phone: address.phone,
        address_line1: address.line1,
        address_line2: address.line2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        total_amount: totalAmount,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw new Error(`DB insert failed: ${orderError.message}`)

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_id: item.id,
      item_name: item.name,
      item_price: item.price * 100, // paise
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw new Error(`Items insert failed: ${itemsError.message}`)

    // Create Razorpay order
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

    // Update order with razorpay_order_id
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
