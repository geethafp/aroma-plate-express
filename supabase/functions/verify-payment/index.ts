import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${orderId}|${paymentId}`)
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === signature
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!RAZORPAY_KEY_SECRET) throw new Error('RAZORPAY_KEY_SECRET not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      throw new Error('Missing payment verification fields')
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, razorpay_order_id, payment_status')
      .eq('id', order_id)
      .single()

    if (existingOrderError || !existingOrder) {
      throw new Error('Order not found')
    }

    if (existingOrder.razorpay_order_id !== razorpay_order_id) {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order_id)
      return new Response(JSON.stringify({ error: 'Order mismatch during payment verification' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (existingOrder.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, alreadyPaid: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify HMAC signature
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, RAZORPAY_KEY_SECRET)
    if (!isValid) {
      // Mark as failed
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order_id)
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update order as paid
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'paid',
      })
      .eq('id', order_id)
      .select()
      .single()

    if (error) throw new Error(`Update failed: ${error.message}`)

    // Fetch order items for the response
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id)

    return new Response(JSON.stringify({
      success: true,
      order,
      items: orderItems,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
