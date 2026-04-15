import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const readString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const extractAccessToken = (payload: Record<string, unknown>) => {
  return (
    readString(payload['access-token']) ||
    readString(payload.accessToken) ||
    readString(payload.access_token) ||
    readString(payload.token) ||
    (payload.data && typeof payload.data === 'object'
      ? readString((payload.data as Record<string, unknown>)['access-token']) ||
        readString((payload.data as Record<string, unknown>).accessToken) ||
        readString((payload.data as Record<string, unknown>).access_token) ||
        readString((payload.data as Record<string, unknown>).token)
      : null)
  )
}

const extractMobile = (payload: Record<string, unknown>): string | null => {
  return (
    readString(payload.mobile) ||
    readString(payload.phone) ||
    readString(payload.identifier) ||
    (payload.data && typeof payload.data === 'object'
      ? readString((payload.data as Record<string, unknown>).mobile) ||
        readString((payload.data as Record<string, unknown>).phone) ||
        readString((payload.data as Record<string, unknown>).identifier)
      : null)
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MSG91_AUTH_KEY) throw new Error('MSG91_AUTH_KEY not configured')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase environment variables are not configured')

    const requestPayload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const accessToken = extractAccessToken(requestPayload)

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing access token from MSG91 widget' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const msg91Res = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authkey: MSG91_AUTH_KEY,
        'access-token': accessToken,
      }),
    })

    const verificationResult = await msg91Res.json().catch(() => ({}))

    if (!msg91Res.ok) {
      const message =
        (verificationResult && typeof verificationResult === 'object' && 'message' in verificationResult && readString((verificationResult as Record<string, unknown>).message)) ||
        (verificationResult && typeof verificationResult === 'object' && 'msg' in verificationResult && readString((verificationResult as Record<string, unknown>).msg)) ||
        'MSG91 widget verification failed'

      return new Response(JSON.stringify({ error: message, details: verificationResult }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verifiedPayload =
      verificationResult && typeof verificationResult === 'object'
        ? (verificationResult as Record<string, unknown>)
        : {}

    const verifiedMobile = extractMobile(verifiedPayload)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let userId: string | null = null
    if (verifiedMobile) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find((user) => user.phone === verifiedMobile)

      if (existingUser) {
        userId = existingUser.id
        await supabase.auth.admin.updateUserById(userId, {
          phone: verifiedMobile,
          phone_confirm: true,
        })
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: verifiedMobile,
          phone_confirm: true,
        })

        if (createError) {
          throw new Error(createError.message)
        }

        userId = newUser.user?.id ?? null
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        phone: verifiedMobile,
        userId,
        verificationResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('verify-msg91-widget error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
