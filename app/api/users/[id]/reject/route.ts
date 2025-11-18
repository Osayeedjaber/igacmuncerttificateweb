import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/utils/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireSuperAdmin()
    const { id } = params
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('users')
      .update({
        account_status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'User rejected successfully',
      user: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reject user' },
      { status: 500 }
    )
  }
}

