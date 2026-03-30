const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY')
    if (!MSG91_AUTH_KEY) throw new Error('MSG91_AUTH_KEY not configured')

    const {
      phone,
      customerName,
      orderId,
      totalAmount,
      deliveryDate,
      deliveryTime,
      paymentMethod,
      items,
    } = await req.json()

    if (!phone || !customerName || !orderId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mobileWithCountry = phone.startsWith('91') ? phone : `91${phone}`
    const formattedAmount = `Rs. ${(totalAmount).toLocaleString('en-IN')}`
    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'

    const itemsList = (items || [])
      .map((item: { name: string; quantity: number }) => `${item.name} x${item.quantity}`)
      .join(', ')

    // Send WhatsApp message via MSG91 Flow API
    const response = await fetch('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        integrated_number: Deno.env.get('MSG91_WHATSAPP_NUMBER') || '',
        content_type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          type: 'text',
          text: {
            body: `🎉 *Order Confirmed!*\n\nHi ${customerName},\n\nYour order *#${orderId.slice(0, 8)}* has been placed successfully!\n\n📦 *Items:* ${itemsList}\n💰 *Total:* ${formattedAmount}\n💳 *Payment:* ${paymentLabel}\n📅 *Delivery:* ${deliveryDate} at ${deliveryTime}\n\nThank you for ordering from Annapurna Catering! 🙏`,
          },
        },
        recipients: [{
          mobiles: mobileWithCountry,
        }],
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('MSG91 WhatsApp send error:', result)
      // Don't throw — order is already placed, just log the failure
      return new Response(JSON.stringify({ success: false, warning: 'Order placed but WhatsApp notification failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    // Non-critical: don't fail the order
    return new Response(JSON.stringify({ success: false, warning: 'WhatsApp notification failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
