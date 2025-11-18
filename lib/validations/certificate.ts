import { z } from 'zod'

// Certificate type definitions
export const CERTIFICATE_TYPES = {
  MUN: {
    'MUN Participant': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Campus Ambassador': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Secretariat Board Member': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Outstanding Delegate 1': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Outstanding Delegate 2': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Outstanding Delegate 3': ['name', 'school', 'country', 'committee', 'date_issued'],
    'Best Delegate': ['name', 'school', 'country', 'committee', 'date_issued'],
  },
  BIZCOM: {
    'BizCom Participant': ['name', 'school', 'segment', 'team_name', 'date_issued'],
    'BizCom Winner': ['name', 'school', 'segment', 'team_name', 'date_issued'],
  },
  SPECIAL_MENTION: {
    'Special Mention 1': ['name', 'school', 'date_issued'],
    'Special Mention 2': ['name', 'school', 'date_issued'],
    'Special Mention 3': ['name', 'school', 'date_issued'],
    'Special Mention 5': ['name', 'school', 'date_issued'],
  }
} as const

// Determine award category based on certificate type
export function getAwardCategory(certificateType: string): 'MUN' | 'BIZCOM' | 'SPECIAL_MENTION' | 'OTHER' {
  const normalized = certificateType.toLowerCase().trim()
  
  // MUN-related keywords
  const munKeywords = ['delegate', 'ambassador', 'participant', 'secretariat', 'mun', 'committee', 'country']
  if (munKeywords.some(keyword => normalized.includes(keyword))) {
    return 'MUN'
  }
  
  // BizCom-related keywords
  const bizcomKeywords = ['bizcom', 'business', 'segment', 'team']
  if (bizcomKeywords.some(keyword => normalized.includes(keyword))) {
    return 'BIZCOM'
  }
  
  // Special Mention keywords
  const specialMentionKeywords = ['special mention', 'mention']
  if (specialMentionKeywords.some(keyword => normalized.includes(keyword))) {
    return 'SPECIAL_MENTION'
  }
  
  return 'OTHER'
}

// Normalize certificate type (preserve original but standardize capitalization)
export function normalizeCertificateType(type: string): string {
  const normalized = type.trim()
  
  // If it matches a known type exactly (case-insensitive), return the standard version
  const allTypes = [
    ...Object.keys(CERTIFICATE_TYPES.MUN),
    ...Object.keys(CERTIFICATE_TYPES.BIZCOM),
    ...Object.keys(CERTIFICATE_TYPES.SPECIAL_MENTION),
  ]
  
  const found = allTypes.find(t => t.toLowerCase() === normalized.toLowerCase())
  if (found) {
    return found
  }
  
  // Handle common variations
  const variations: Record<string, string> = {
    'special mention 1': 'Special Mention 1',
    'special mention 2': 'Special Mention 2',
    'special mention 3': 'Special Mention 3',
    'special mention 5': 'Special Mention 5',
    'outstanding delegate 1': 'Outstanding Delegate 1',
    'outstanding delegate 2': 'Outstanding Delegate 2',
    'outstanding delegate 3': 'Outstanding Delegate 3',
    'best delegate': 'Best Delegate',
    'mun participant': 'MUN Participant',
    'campus ambassador': 'Campus Ambassador',
    'secretariat board member': 'Secretariat Board Member',
  }
  
  return variations[normalized.toLowerCase()] || normalized // Return original if no match
}

export function getRequiredFields(certificateType: string): string[] {
  const normalized = normalizeCertificateType(certificateType)
  const category = getAwardCategory(normalized)
  
  // Check if it's a known type in our definitions
  for (const typeCategory of Object.values(CERTIFICATE_TYPES)) {
    if (normalized in typeCategory) {
      const fields = typeCategory[normalized as keyof typeof typeCategory] || []
      // Map legacy 'name' to our actual field 'participant_name'
      return fields
        .map((f) => (f === 'name' ? 'participant_name' : f))
        // Only enforce participant_name; all other fields are optional in the UI
        .filter((f) => f === 'participant_name')
    }
  }
  
  // Fallback: only require participant_name; everything else is optional
  return ['participant_name']
}

// Base certificate schema
const baseCertificateSchema = z.object({
  certificate_type: z.string(),
  participant_name: z.string().min(1, 'Participant name is required'),
  school: z.union([z.string(), z.null()]).optional().transform(val => val || 'N/A'),
  date_issued: z.union([z.string(), z.null()]).optional().transform(val => {
    if (!val || val === 'null' || val === null) {
      // Default to today's date if not provided
      const today = new Date()
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    }
    // If it's already a valid date, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return val
    }
    // Otherwise, default to today
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }),
})

// MUN certificate schema
export const munCertificateSchema = baseCertificateSchema.extend({
  certificate_type: z.enum(['MUN Participant', 'Campus Ambassador', 'Secretariat Board Member', 'Outstanding Delegate 1', 'Outstanding Delegate 2', 'Outstanding Delegate 3', 'Best Delegate']),
  country: z.string().min(1, 'Country is required'),
  committee: z.string().min(1, 'Committee is required'),
})

// BizCom certificate schema
export const bizComCertificateSchema = baseCertificateSchema.extend({
  certificate_type: z.enum(['BizCom Participant', 'BizCom Winner']),
  segment: z.string().min(1, 'Segment is required'),
  team_name: z.string().min(1, 'Team name is required'),
  team_members: z.array(z.string()).optional(),
})

// Special Mention certificate schema
export const specialMentionSchema = baseCertificateSchema.extend({
  certificate_type: z.enum(['Special Mention 1', 'Special Mention 2', 'Special Mention 3', 'Special Mention 5']),
})

// Flexible certificate schema (for custom fields)
export const flexibleCertificateSchema = baseCertificateSchema.extend({
  country: z.string().optional(),
  committee: z.string().optional(),
  segment: z.string().optional(),
  team_name: z.string().optional(),
  team_members: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
}).passthrough() // Allow any additional fields

// Bulk import schema
export const bulkImportSchema = z.object({
  event_code: z.string().min(1, 'Event code is required'),
  certificates: z.array(flexibleCertificateSchema).min(1, 'At least one certificate is required'),
})

// Event schema
export const eventSchema = z.object({
  event_code: z.string().min(1, 'Event code is required'),
  event_name: z.string().min(1, 'Event name is required'),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  session: z.number().int().min(1),
  event_type: z.string().min(1, 'Event type is required'),
})

// Revocation schema
export const revocationSchema = z.object({
  reason: z.string().min(1, 'Revocation reason is required'),
})

export type MunCertificate = z.infer<typeof munCertificateSchema>
export type BizComCertificate = z.infer<typeof bizComCertificateSchema>
export type SpecialMentionCertificate = z.infer<typeof specialMentionSchema>
export type FlexibleCertificate = z.infer<typeof flexibleCertificateSchema>
export type BulkImport = z.infer<typeof bulkImportSchema>
export type Event = z.infer<typeof eventSchema>
export type Revocation = z.infer<typeof revocationSchema>

