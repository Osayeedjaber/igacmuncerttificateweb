import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

type UserData = Database['public']['Tables']['users']['Row']

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const pendingCookies: {
      name: string
      value: string
      options: Parameters<NextResponse['cookies']['set']>[2]
    }[] = []

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options })
            })
          },
        },
      }
    )

    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    // Check if user account is approved
    const adminSupabase = createAdminClient()

    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('account_status, role')
      .eq('id', data.user.id)
      .single() as { data: Pick<UserData, 'account_status' | 'role'> | null, error: any }

    let account = userData

    if (userError || !userData) {
      const { data: upserted, error: upsertError } = await (adminSupabase as any)
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email ?? email,
          role: 'mod',
          account_status: 'pending_approval'
        })
        .select('account_status, role')
        .single()

      if (upsertError || !upserted) {
        await supabase.auth.signOut()
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 403 }
        )
      }

      account = upserted
    }
    
    if (!account || account.account_status !== 'approved') {
      await supabase.auth.signOut()
      const response = NextResponse.json(
        { error: 'Account is pending approval or has been rejected' },
        { status: 403 }
      )
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }
    
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: account.role,
        account_status: account.account_status
      }
    })

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    response.cookies.set('igac-role', account.role, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    response.cookies.set('igac-status', account.account_status, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    )
  }
}

