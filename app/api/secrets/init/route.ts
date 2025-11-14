import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// This endpoint should be called once to initialize secrets
// It should be protected or run manually via Supabase dashboard
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Insert or update secrets
    const secrets = [
      {
        key: 'signup_password',
        value: 'igac5889@',
        description: 'Password required for sign-up requests'
      },
      {
        key: 'role_change_password',
        value: 'osayeedjaber5889@',
        description: 'Password required to change user role to admin or super_admin'
      }
    ]

    const results = []
    for (const secret of secrets) {
      const { data, error } = await (supabase as any)
        .from('secrets')
        .upsert({
          key: secret.key,
          value: secret.value,
          description: secret.description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })
        .select()
        .single()

      if (error) {
        results.push({ key: secret.key, error: error.message })
      } else {
        results.push({ key: secret.key, success: true })
      }
    }

    return NextResponse.json({
      message: 'Secrets initialized',
      results
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initialize secrets' },
      { status: 500 }
    )
  }
}

