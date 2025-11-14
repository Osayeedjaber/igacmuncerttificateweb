import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'

export async function generateQRCode(certificateId: string): Promise<{
  data: string;
  imageBuffer: Buffer;
}> {
  const verifyUrl = process.env.NEXT_PUBLIC_VERIFY_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const qrCodeUrl = `${verifyUrl}/verify/${certificateId}`
  
  // Generate QR code as buffer for storage
  const buffer = await QRCode.toBuffer(qrCodeUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })
  
  return {
    data: qrCodeUrl,
    imageBuffer: buffer
  }
}

export async function uploadQRCodeToStorage(
  certificateId: string,
  qrCodeBuffer: Buffer
): Promise<string> {
  const supabase = createAdminClient()
  const filePath = `${certificateId}.png`
  
  const { error } = await supabase.storage
    .from('qr-codes')
    .upload(filePath, qrCodeBuffer, {
      contentType: 'image/png',
      upsert: true
    })
  
  if (error) {
    throw new Error(`Failed to upload QR code: ${error.message}`)
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(filePath)
  
  return urlData.publicUrl
}

