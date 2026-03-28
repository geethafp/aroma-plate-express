import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type ListOrdersRequest = {
  limit?: number
  page?: number
  paymentMethod?: string
  paymentStatus?: string
  search?: string
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const parsePositiveInt = (value: unknown, fallback: number) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Supabase environment variables are not configured')
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedEmails = (Deno.env.get('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    if (
      allowedEmails.length > 0 &&
      (!user.email || !allowedEmails.includes(user.email.toLowerCase()))
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = ((await req.json().catch(() => ({}))) ?? {}) as ListOrdersRequest
    const page = parsePositiveInt(payload.page, 1)
    const limit = Math.min(parsePositiveInt(payload.limit, 10), 50)
    const from = (page - 1) * limit
    const to = from + limit - 1
    const paymentStatus = payload.paymentStatus?.trim() ?? 'all'
    const paymentMethod = payload.paymentMethod?.trim() ?? 'all'
    const search = payload.search?.trim() ?? ''

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    let query = serviceClient
      .from('orders')
      .select(
        'id, customer_name, customer_phone, address_line1, address_line2, city, state, pincode, delivery_date, delivery_time, total_amount, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, created_at, order_items(id, item_id, item_name, item_price, quantity)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    if (paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod)
    }

    if (search) {
      const filters = [
        `customer_name.ilike.%${search}%`,
        `customer_phone.ilike.%${search}%`,
        `city.ilike.%${search}%`,
      ]

      if (uuidPattern.test(search)) {
        filters.push(`id.eq.${search}`)
      }

      query = query.or(filters.join(','))
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return new Response(
      JSON.stringify({
        limit,
        orders: data ?? [],
        page,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        user: {
          email: user.email ?? null,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error listing orders:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
