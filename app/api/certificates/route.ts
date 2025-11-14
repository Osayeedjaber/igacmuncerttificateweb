import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'
import { generateCertificateId, ensureUniqueCertificateId } from '@/lib/utils/certificate-id'
import { generateQRCode, uploadQRCodeToStorage } from '@/lib/utils/qr-code'
import { getRequiredFields } from '@/lib/validations/certificate'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const eventId = searchParams.get('event_id')
    const certificateType = searchParams.get('certificate_type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let query = supabase
      .from('certificates')
      .select(`
        *,
        events (*),
        certificate_metadata (*)
      `)
      .order('created_at', { ascending: false })
    
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    
    if (certificateType) {
      query = query.eq('certificate_type', certificateType)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`participant_name.ilike.%${search}%,certificate_id.ilike.%${search}%,school.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ certificates: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()
    
    // Get event to extract event_code and year
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_code, year')
      .eq('id', body.event_id)
      .single() as { data: { event_code: string, year: number } | null, error: any }
    
    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Validate required fields
    const requiredFields = getRequiredFields(body.certificate_type)
    const missingFields = requiredFields.filter(field => !body[field] && !body.custom_fields?.[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Generate certificate ID
    const baseCertificateId = generateCertificateId(
      event.event_code,
      event.year,
      body.participant_name,
      body.school
    )
    
    const certificateId = await ensureUniqueCertificateId(supabase, baseCertificateId)
    
    // Generate QR code
    const { data: qrCodeData, imageBuffer } = await generateQRCode(certificateId)
    const qrCodeImagePath = await uploadQRCodeToStorage(certificateId, imageBuffer)
    
    // Insert certificate
    const { data: certificate, error: certError } = await (supabase as any)
      .from('certificates')
      .insert({
        certificate_id: certificateId,
        event_id: body.event_id,
        certificate_type: body.certificate_type,
        participant_name: body.participant_name,
        school: body.school,
        date_issued: body.date_issued,
        qr_code_data: qrCodeData,
        qr_code_image_path: qrCodeImagePath,
        created_by: user.id
      })
      .select()
      .single()
    
    if (certError) {
      return NextResponse.json(
        { error: certError.message },
        { status: 500 }
      )
    }
    
    // Insert metadata for custom fields
    if (body.custom_fields || body.country || body.committee || body.segment || body.team_name) {
      const metadataEntries = []
      
      // Standard fields
      if (body.country) metadataEntries.push({ certificate_id: certificate.id, field_name: 'country', field_value: body.country, field_type: 'text' })
      if (body.committee) metadataEntries.push({ certificate_id: certificate.id, field_name: 'committee', field_value: body.committee, field_type: 'text' })
      if (body.segment) metadataEntries.push({ certificate_id: certificate.id, field_name: 'segment', field_value: body.segment, field_type: 'text' })
      if (body.team_name) metadataEntries.push({ certificate_id: certificate.id, field_name: 'team_name', field_value: body.team_name, field_type: 'text' })
      if (body.team_members) metadataEntries.push({ certificate_id: certificate.id, field_name: 'team_members', field_value: JSON.stringify(body.team_members), field_type: 'array' })
      
      // Custom fields
      if (body.custom_fields) {
        for (const [key, value] of Object.entries(body.custom_fields)) {
          metadataEntries.push({
            certificate_id: certificate.id,
            field_name: key,
            field_value: typeof value === 'string' ? value : JSON.stringify(value),
            field_type: typeof value === 'object' ? 'json' : 'text'
          })
        }
      }
      
      if (metadataEntries.length > 0) {
        await (supabase as any)
          .from('certificate_metadata')
          .insert(metadataEntries)
      }
    }
    
    return NextResponse.json({
      certificate: {
        ...certificate,
        qr_code_image_url: qrCodeImagePath
      }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create certificate' },
      { status: 500 }
    )
  }
}

