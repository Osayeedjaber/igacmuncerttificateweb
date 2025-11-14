import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'
import { bulkImportSchema, getRequiredFields, normalizeCertificateType } from '@/lib/validations/certificate'
import { generateCertificateId, ensureUniqueCertificateId } from '@/lib/utils/certificate-id'
import { generateQRCode, uploadQRCodeToStorage } from '@/lib/utils/qr-code'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate JSON structure (use safeParse to handle validation errors gracefully)
    const validationResult = bulkImportSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid JSON structure', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    const validatedData = validationResult.data
    
    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_code, year')
      .eq('event_code', validatedData.event_code)
      .single() as { data: { id: string, event_code: string, year: number } | null, error: any }
    
    if (eventError || !event) {
      return NextResponse.json(
        { error: `Event with code "${validatedData.event_code}" not found` },
        { status: 404 }
      )
    }
    
    const results = {
      success: [] as any[],
      errors: [] as any[]
    }
    
    // Process each certificate
    for (let i = 0; i < validatedData.certificates.length; i++) {
      const cert = validatedData.certificates[i]
      const certAny: any = cert as any
      
      try {
        // Normalize certificate type (handle case variations, but allow any award name)
        const normalizedType = normalizeCertificateType(cert.certificate_type)
        
        // Update certificate with normalized type (preserves original if not in known types)
        cert.certificate_type = normalizedType
        
        // Handle null/empty values
        if (!cert.school || cert.school === 'null' || cert.school === null) {
          cert.school = 'N/A'
        }
        
        if (!cert.date_issued || cert.date_issued === 'null' || cert.date_issued === null) {
          const today = new Date()
          cert.date_issued = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        }
        
        // Clean up country field (remove leading numbers, trailing commas)
        if (certAny.country) {
          const cleaned = certAny.country.toString().replace(/^\d+/, '').replace(/,$/, '').trim()
          certAny.country = cleaned || certAny.country // Keep original if cleaning results in empty
        }
        
        // Validate required fields
        const requiredFields = getRequiredFields(normalizedType)
        const missingFields = requiredFields.filter(field => {
          if (field === 'name') return !cert.participant_name
          if (field === 'date_issued') return !cert.date_issued
          if (field === 'school') return !cert.school || cert.school === 'null'
          // Check both certAny and the original cert object for fields
          const fieldValue = certAny[field] || (cert as any)[field]
          return !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')
        })
        
        if (missingFields.length > 0) {
          results.errors.push({
            index: i,
            participant_name: cert.participant_name || 'Unknown',
            error: `Missing required fields: ${missingFields.join(', ')}`
          })
          continue
        }
        
        // Generate certificate ID
        const baseCertificateId = generateCertificateId(
          event.event_code,
          event.year,
          cert.participant_name,
          cert.school || 'na'
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
            event_id: event.id,
            certificate_type: cert.certificate_type,
            participant_name: cert.participant_name,
            school: cert.school,
            date_issued: cert.date_issued,
            qr_code_data: qrCodeData,
            qr_code_image_path: qrCodeImagePath,
            created_by: user.id
          })
          .select()
          .single()
        
        if (certError) {
          results.errors.push({
            index: i,
            participant_name: cert.participant_name,
            error: certError.message
          })
          continue
        }
        
        // Insert metadata
        const metadataEntries = []
        
        // Standard fields
        if (certAny.country) metadataEntries.push({ certificate_id: certificate.id, field_name: 'country', field_value: certAny.country, field_type: 'text' })
        if (certAny.committee) metadataEntries.push({ certificate_id: certificate.id, field_name: 'committee', field_value: certAny.committee, field_type: 'text' })
        if (certAny.segment) metadataEntries.push({ certificate_id: certificate.id, field_name: 'segment', field_value: certAny.segment, field_type: 'text' })
        if (certAny.team_name) metadataEntries.push({ certificate_id: certificate.id, field_name: 'team_name', field_value: certAny.team_name, field_type: 'text' })
        if (certAny.team_members) metadataEntries.push({ certificate_id: certificate.id, field_name: 'team_members', field_value: JSON.stringify(certAny.team_members), field_type: 'array' })
        
        // Custom fields
        if (cert.custom_fields) {
          for (const [key, value] of Object.entries(cert.custom_fields)) {
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
        
        results.success.push({
          index: i,
          certificate_id: certificateId,
          participant_name: cert.participant_name,
          qr_code_image_url: qrCodeImagePath
        })
      } catch (error: any) {
        results.errors.push({
          index: i,
          participant_name: cert.participant_name || 'Unknown',
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      message: `Import completed: ${results.success.length} successful, ${results.errors.length} errors`,
      success_count: results.success.length,
      error_count: results.errors.length,
      results: results
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to import certificates' },
      { status: 500 }
    )
  }
}

