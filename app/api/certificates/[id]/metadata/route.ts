import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params
    const supabase = await createClient()
    const body = await request.json()
    const { metadata } = body

    if (!Array.isArray(metadata)) {
      return NextResponse.json(
        { error: 'Metadata must be an array' },
        { status: 400 }
      )
    }

    // Delete existing metadata for this certificate
    await supabase
      .from('certificate_metadata')
      .delete()
      .eq('certificate_id', id)

    // Insert new metadata
    if (metadata.length > 0) {
      const { error: insertError } = await (supabase as any)
        .from('certificate_metadata')
        .insert(metadata)

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update metadata' },
      { status: 500 }
    )
  }
}

