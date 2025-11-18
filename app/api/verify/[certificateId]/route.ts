import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    const { certificateId } = params
    const supabase = await createClient()
    
    // Get certificate with all related data
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        events (*),
        certificate_metadata (*)
      `)
      .eq('certificate_id', certificateId)
      .single() as { data: any, error: any }
    
    if (error || !certificate) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Certificate not found' 
        },
        { status: 404 }
      )
    }
    
    // Check if revoked
    if (certificate.status === 'revoked') {
      // Log verification attempt
      const headersList = await headers()
      await (supabase as any)
        .from('verification_logs')
        .insert({
          certificate_id: certificate.id,
          ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
          user_agent: headersList.get('user-agent') || null
        })
      
      return NextResponse.json({
        valid: false,
        status: 'revoked',
        revoked_at: certificate.revoked_at,
        revoked_reason: certificate.revoked_reason,
        contact_email: 'intlglobalaffairscouncil@gmail.com',
        certificate: formatCertificateResponse(certificate)
      })
    }
    
    // Log verification
    const headersList = await headers()
    await (supabase as any)
      .from('verification_logs')
      .insert({
        certificate_id: certificate.id,
        ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
        user_agent: headersList.get('user-agent') || null
      })
    
    // Update verification count
    await (supabase as any)
      .from('certificates')
      .update({
        verification_count: (certificate.verification_count || 0) + 1,
        last_verified_at: new Date().toISOString()
      })
      .eq('id', certificate.id)
    
    return NextResponse.json({
      valid: true,
      certificate: formatCertificateResponse(certificate)
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        valid: false,
        error: error.message || 'Failed to verify certificate' 
      },
      { status: 500 }
    )
  }
}

function formatCertificateResponse(certificate: any) {
  const metadata = (certificate.certificate_metadata || []).reduce((acc: any, meta: any) => {
    if (meta.field_type === 'json' || meta.field_type === 'array') {
      try {
        acc[meta.field_name] = JSON.parse(meta.field_value);
      } catch {
        acc[meta.field_name] = meta.field_value;
      }
    } else {
      acc[meta.field_name] = meta.field_value;
    }
    return acc
  }, {})
  
  return {
    certificate_id: certificate.certificate_id,
    participant_name: certificate.participant_name,
    school: certificate.school,
    certificate_type: certificate.certificate_type,
    event: certificate.events?.event_name || null,
    event_code: certificate.events?.event_code || null,
    date_issued: certificate.date_issued,
    status: certificate.status,
    pdf_available: certificate.pdf_available || false,
    pdf_download_url: certificate.pdf_storage_path || null,
    ...metadata
  }
}

