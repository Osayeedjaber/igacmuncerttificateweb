-- Create storage buckets for QR codes and certificates

-- QR Codes bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes',
  'qr-codes',
  true,
  1048576, -- 1MB
  ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Certificates bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for QR codes (public read)
CREATE POLICY "QR codes are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
  )
);

-- Storage policies for certificates (admin only)
CREATE POLICY "Admins can view certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
  )
);

CREATE POLICY "Admins can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND account_status = 'approved'
  )
);

