import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAdmin()
    const { eventId } = await params
    const supabase = await createClient()
    
    // Get all certificates for the event
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        certificate_id,
        participant_name,
        school,
        certificate_type,
        qr_code_image_path,
        certificate_metadata (*)
      `)
      .eq('event_id', eventId)
      .order('participant_name')
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Format data for export
    const exportData = (certificates as any[]).map((cert: any) => {
      const metadata = ((cert.certificate_metadata || []) as any[]).reduce((acc: any, meta: any) => {
        acc[meta.field_name] = meta.field_type === 'json' || meta.field_type === 'array' 
          ? JSON.parse(meta.field_value) 
          : meta.field_value
        return acc
      }, {})
      
      return {
        certificate_id: cert.certificate_id,
        participant_name: cert.participant_name,
        school: cert.school,
        certificate_type: cert.certificate_type,
        qr_code_image_url: cert.qr_code_image_path,
        ...metadata
      }
    })
    
    return NextResponse.json({
      event_id: eventId,
      total_certificates: exportData.length,
      certificates: exportData
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export certificates' },
      { status: 500 }
    )
  }
}

