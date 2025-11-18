-- Additional constraints and indexes for cleaner, faster queries
-- Run this in the Supabase SQL editor after applying the base schema.

-- 1) Ensure certificate_id is unique (external identifier)
ALTER TABLE public.certificates
ADD CONSTRAINT certificates_certificate_id_key UNIQUE (certificate_id);

-- 2) Indexes to speed up common filters/lookups

-- Certificates by status (e.g., revoked vs active)
CREATE INDEX IF NOT EXISTS idx_certificates_status
  ON public.certificates (status);

-- Certificates by event
CREATE INDEX IF NOT EXISTS idx_certificates_event_id
  ON public.certificates (event_id);

-- Certificates by certificate_id (verification endpoint)
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id
  ON public.certificates (certificate_id);

-- Users by account_status and role (admin views)
CREATE INDEX IF NOT EXISTS idx_users_account_status
  ON public.users (account_status);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users (role);

-- Verification logs by certificate/time (future analytics)
CREATE INDEX IF NOT EXISTS idx_verification_logs_certificate_time
  ON public.verification_logs (certificate_id, verified_at DESC);

-- 3) (Optional) Prepare for hashed secrets instead of plain text
--
-- If you want to move away from plain-text secret storage, you can:
--   a) Add a column to mark hashed values
--   b) Gradually migrate calling code to store/compare hashes
-- Commented out by default so you can opt in when ready.

-- ALTER TABLE public.secrets
--   ADD COLUMN IF NOT EXISTS is_hashed boolean NOT NULL DEFAULT false;

-- After adding is_hashed, you can update your API code to:
--   - Hash incoming passwords
--   - Compare against secrets.value when secrets.is_hashed = true
