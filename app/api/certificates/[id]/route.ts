import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()
    
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        events (*),
        certificate_metadata (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ certificate })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params
    const supabase = await createClient()
    const body = await request.json()
    
    // Certificate ID cannot be changed
    const updateData = { ...body }
    delete updateData.certificate_id
    
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
    
    return NextResponse.json({ certificate: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update certificate' },
      { status: 500 }
    )
  }
}

