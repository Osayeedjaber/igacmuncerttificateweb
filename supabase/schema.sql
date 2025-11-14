-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Secrets table for storing sensitive passwords
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on secrets
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

-- Insert initial secrets (use admin client to insert these)
-- These should be set via Supabase dashboard or admin API after initial setup

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'mod')),
    account_status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (account_status IN ('pending_approval', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_code TEXT UNIQUE NOT NULL,
    event_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    session INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id TEXT UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    certificate_type TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    school TEXT NOT NULL,
    date_issued DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.users(id),
    revoked_reason TEXT,
    qr_code_data TEXT NOT NULL,
    qr_code_image_path TEXT,
    pdf_storage_path TEXT,
    pdf_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    verification_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMPTZ
);

-- Certificate metadata table (for flexible fields)
CREATE TABLE IF NOT EXISTS public.certificate_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_value TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'array', 'json')),
    UNIQUE(certificate_id, field_name)
);

-- Verification logs table
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Analytics table (aggregated stats)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificate_metadata_certificate_id ON public.certificate_metadata(certificate_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_certificate_id ON public.verification_logs(certificate_id);
CREATE INDEX IF NOT EXISTS idx_events_event_code ON public.events(event_code);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin' AND account_status = 'approved'
        )
    );

CREATE POLICY "Super admins can update user accounts"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin' AND account_status = 'approved'
        )
    );

-- Events policies
CREATE POLICY "Events are publicly readable"
    ON public.events FOR SELECT
    USING (true);

CREATE POLICY "Admins can create events"
    ON public.events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

CREATE POLICY "Admins can update events"
    ON public.events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

CREATE POLICY "Admins can delete events"
    ON public.events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

-- Certificates policies
CREATE POLICY "Certificates are publicly readable for verification"
    ON public.certificates FOR SELECT
    USING (true);

CREATE POLICY "Admins can create certificates"
    ON public.certificates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

CREATE POLICY "Admins can update certificates"
    ON public.certificates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

-- Certificate metadata policies
CREATE POLICY "Certificate metadata is publicly readable"
    ON public.certificate_metadata FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage certificate metadata"
    ON public.certificate_metadata FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

-- Verification logs policies
CREATE POLICY "Admins can view verification logs"
    ON public.verification_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'mod') AND account_status = 'approved'
        )
    );

CREATE POLICY "Anyone can create verification logs (for public verification)"
    ON public.verification_logs FOR INSERT
    WITH CHECK (true);

-- Analytics policies
CREATE POLICY "Admins can view analytics"
    ON public.analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'mod') AND account_status = 'approved'
        )
    );

CREATE POLICY "Admins can create analytics"
    ON public.analytics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
        )
    );

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, account_status)
    VALUES (
        NEW.id,
        NEW.email,
        'mod', -- Default role is mod
        'pending_approval' -- Default status is pending approval
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

