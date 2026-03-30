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
    const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID')
    const otpSetupHint = 'Configure Supabase secrets MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in the dashboard. MSG91_WHATSAPP_NUMBER is not used for login OTP.'

    if (!MSG91_AUTH_KEY) throw new Error(`MSG91_AUTH_KEY not configured. ${otpSetupHint}`)
    if (!MSG91_TEMPLATE_ID) throw new Error(`MSG91_TEMPLATE_ID not configured. ${otpSetupHint}`)

    const { phone } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Valid 10-digit phone number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mobileWithCountry = `91${phone}`

    // Send OTP via MSG91 WhatsApp channel
    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        mobile: mobileWithCountry,
        otp_length: 4,
        otp_expiry: 5,
        realTimeResponse: true,
      }),
    })

    const result = await response.json()

    if (!response.ok || result.type === 'error') {
      console.error('MSG91 OTP send error:', result)
      throw new Error(result.message || `Failed to send OTP. ${otpSetupHint}`)
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent via WhatsApp' }), {
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
