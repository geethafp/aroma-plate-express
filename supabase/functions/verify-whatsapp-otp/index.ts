import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { phone, otp } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Valid 10-digit phone number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!otp || !/^\d{4}$/.test(otp)) {
      return new Response(JSON.stringify({ error: 'Valid 4-digit OTP required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mobileWithCountry = `91${phone}`

    // Verify OTP via MSG91
    const response = await fetch(
      `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${mobileWithCountry}`,
      {
        method: 'GET',
        headers: {
          'authkey': MSG91_AUTH_KEY,
        },
      }
    )

    const result = await response.json()

    if (result.type === 'error') {
      return new Response(JSON.stringify({ error: result.message || 'Invalid OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // OTP verified — create or sign in user via Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if user exists with this phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.phone === mobileWithCountry)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Update phone confirmed
      await supabase.auth.admin.updateUserById(userId, {
        phone: mobileWithCountry,
        phone_confirm: true,
      })
    } else {
      // Create new user with phone
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: mobileWithCountry,
        phone_confirm: true,
      })
      if (createError || !newUser.user) {
        throw new Error(createError?.message || 'Failed to create user')
      }
      userId = newUser.user.id
    }

    // Generate a magic link token for session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${mobileWithCountry}@phone.auth`,
    })

    // Alternative: return success and let frontend handle session
    return new Response(JSON.stringify({
      success: true,
      verified: true,
      userId,
      phone: mobileWithCountry,
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
