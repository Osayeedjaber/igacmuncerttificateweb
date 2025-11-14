import { createHash } from 'crypto'

/**
 * Generate a short unique code (6-8 characters) from input data
 */
function generateShortCode(input: string): string {
  // Create a hash from the input
  const hash = createHash('sha256').update(input).digest('hex')
  
  // Take first 8 characters and convert to base36 for shorter representation
  const shortHash = hash.substring(0, 8)
  
  // Convert to base36 (0-9, a-z) for a more compact code
  const num = parseInt(shortHash, 16)
  const base36 = num.toString(36)
  
  // Take first 8 characters, pad if needed
  return base36.substring(0, 8).padStart(6, '0')
}

/**
 * Generate a short, unique certificate ID
 * Format: {eventCode}-{shortCode}
 * Example: igacmun-session-3-2025-a3k9j2x1
 */
export function generateCertificateId(
  eventCode: string,
  year: number,
  participantName: string,
  school: string
): string {
  // Create a unique input string from participant data + timestamp
  const uniqueInput = `${participantName}-${school}-${year}-${Date.now()}-${Math.random()}`
  
  // Generate short code
  const shortCode = generateShortCode(uniqueInput)
  
  // Return format: eventCode-shortCode
  return `${eventCode}-${shortCode}`
}

export async function ensureUniqueCertificateId(
  supabase: any,
  baseId: string
): Promise<string> {
  let certificateId = baseId
  let counter = 1
  
  while (true) {
    const { data, error } = await supabase
      .from('certificates')
      .select('certificate_id')
      .eq('certificate_id', certificateId)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // No row found, ID is unique
      return certificateId
    }
    
    if (data) {
      // ID exists, append counter
      certificateId = `${baseId}-${counter}`
      counter++
    } else {
      // Some other error, return the ID anyway
      return certificateId
    }
  }
}

