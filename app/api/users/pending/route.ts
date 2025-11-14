import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/utils/auth'

export async function GET(_request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('account_status', 'pending_approval')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ users: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending users' },
      { status: 500 }
    )
  }
}

