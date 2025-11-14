import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/utils/auth'
import { revocationSchema } from '@/lib/validations/certificate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { reason } = revocationSchema.parse(body)
    
    const updateData = {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      revoked_reason: reason
    }
    
    const { data, error } = await (supabase as any)
      .from('certificates')
      .update(updateData)
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
      message: 'Certificate revoked successfully',
      certificate: data
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to revoke certificate' },
      { status: 500 }
    )
  }
}

