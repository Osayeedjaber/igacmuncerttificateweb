-- Secrets table for storing sensitive passwords
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Only super admins can view secrets
CREATE POLICY "Super admins can view secrets"
    ON public.secrets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin' AND account_status = 'approved'
        )
    );

-- Only super admins can update secrets
CREATE POLICY "Super admins can update secrets"
    ON public.secrets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin' AND account_status = 'approved'
        )
    );

-- Insert initial secrets (these should be set via admin panel or migration)
-- Note: In production, these should be set manually via Supabase dashboard or admin API
INSERT INTO public.secrets (key, value, description)
VALUES 
    ('signup_password', 'igac5889@', 'Password required for sign-up requests'),
    ('role_change_password', 'osayeedjaber5889@', 'Password required to change user role to admin or super_admin')
ON CONFLICT (key) DO NOTHING;

