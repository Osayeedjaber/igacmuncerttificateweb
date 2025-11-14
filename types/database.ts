export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'super_admin' | 'admin' | 'mod'
          account_status: 'pending_approval' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'super_admin' | 'admin' | 'mod'
          account_status?: 'pending_approval' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'mod'
          account_status?: 'pending_approval' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_code: string
          event_name: string
          year: number
          month: number
          session: number
          event_type: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          event_code: string
          event_name: string
          year: number
          month: number
          session: number
          event_type: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          event_code?: string
          event_name?: string
          year?: number
          month?: number
          session?: number
          event_type?: string
          created_at?: string
          created_by?: string | null
        }
      }
      certificates: {
        Row: {
          id: string
          certificate_id: string
          event_id: string
          certificate_type: string
          participant_name: string
          school: string
          date_issued: string
          status: 'active' | 'revoked'
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          qr_code_data: string
          qr_code_image_path: string | null
          pdf_storage_path: string | null
          pdf_available: boolean
          created_at: string
          created_by: string | null
          verification_count: number
          last_verified_at: string | null
        }
        Insert: {
          id?: string
          certificate_id: string
          event_id: string
          certificate_type: string
          participant_name: string
          school: string
          date_issued: string
          status?: 'active' | 'revoked'
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          qr_code_data: string
          qr_code_image_path?: string | null
          pdf_storage_path?: string | null
          pdf_available?: boolean
          created_at?: string
          created_by?: string | null
          verification_count?: number
          last_verified_at?: string | null
        }
        Update: {
          id?: string
          certificate_id?: string
          event_id?: string
          certificate_type?: string
          participant_name?: string
          school?: string
          date_issued?: string
          status?: 'active' | 'revoked'
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          qr_code_data?: string
          qr_code_image_path?: string | null
          pdf_storage_path?: string | null
          pdf_available?: boolean
          created_at?: string
          created_by?: string | null
          verification_count?: number
          last_verified_at?: string | null
        }
      }
      certificate_metadata: {
        Row: {
          id: string
          certificate_id: string
          field_name: string
          field_value: string
          field_type: 'text' | 'array' | 'json'
        }
        Insert: {
          id?: string
          certificate_id: string
          field_name: string
          field_value: string
          field_type?: 'text' | 'array' | 'json'
        }
        Update: {
          id?: string
          certificate_id?: string
          field_name?: string
          field_value?: string
          field_type?: 'text' | 'array' | 'json'
        }
      }
      verification_logs: {
        Row: {
          id: string
          certificate_id: string
          verified_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          certificate_id: string
          verified_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          certificate_id?: string
          verified_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      analytics: {
        Row: {
          id: string
          event_id: string | null
          metric_type: string
          metric_value: Json
          calculated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          metric_type: string
          metric_value: Json
          calculated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          metric_type?: string
          metric_value?: Json
          calculated_at?: string
        }
      }
    }
  }
}

