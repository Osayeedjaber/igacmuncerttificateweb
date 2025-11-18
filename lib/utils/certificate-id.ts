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
 * Example: "sbsj23" (6-8 lowercase letters/digits)
 *
 * The arguments are accepted for backwards compatibility but are only used
 * to add variability to the input; the final ID is always a short random code.
 */
export function generateCertificateId(
  eventCode: string,
  year: number,
  participantName: string,
  school: string
): string {
  const uniqueInput = `${eventCode}-${year}-${participantName}-${school}-${Date.now()}-${Math.random()}`
  const shortCode = generateShortCode(uniqueInput)
  return shortCode
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

