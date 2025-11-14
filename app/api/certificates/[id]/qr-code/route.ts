import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/types/database'

type Certificate = Database['public']['Tables']['certificates']['Row']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get certificate
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('qr_code_image_path, certificate_id')
      .eq('id', id)
      .single() as { data: Pick<Certificate, 'qr_code_image_path' | 'certificate_id'> | null, error: any }
    
    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }
    
    // If QR code image exists, return it
    if (certificate.qr_code_image_path) {
      const adminSupabase = createAdminClient()
      // Extract filename from URL (e.g., get "cert-id.png" from full URL)
      const urlParts = certificate.qr_code_image_path.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      const { data, error: downloadError } = await adminSupabase.storage
        .from('qr-codes')
        .download(fileName)
      
      if (!downloadError && data) {
        const arrayBuffer = await data.arrayBuffer()
        return new NextResponse(Buffer.from(arrayBuffer), {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="${certificate.certificate_id}-qr.png"`
          }
        })
      }
    }
    
    // Fallback: return the QR code data URL or redirect
    return NextResponse.json({
      qr_code_url: certificate.qr_code_image_path,
      certificate_id: certificate.certificate_id
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch QR code' },
      { status: 500 }
    )
  }
}

