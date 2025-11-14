# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VERIFY_URL=https://verify.igac.info
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** to execute the SQL

This will create:
- All database tables
- Row Level Security (RLS) policies
- Automatic user creation trigger

### 4. Set Up Supabase Storage

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `qr-codes`:
   - Make it **Public**
   - File size limit: 1MB
   - Allowed MIME types: `image/png`

3. (Optional) Create a bucket named `certificates`:
   - Make it **Private**
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`

Alternatively, run the SQL in `scripts/setup-storage.sql` in the SQL Editor.

### 5. Create Your First Super Admin

After setting up the database:

1. Sign up a user through Supabase Auth (Authentication > Users > Add User)
2. In SQL Editor, run:

```sql
UPDATE public.users
SET role = 'super_admin', account_status = 'approved'
WHERE email = 'your-email@example.com';
```

### 6. Run the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Testing the API

### 1. Create an Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d '{
    "event_code": "igacmun-session-3-2025",
    "event_name": "IGACMUN Session 3",
    "year": 2025,
    "month": 3,
    "session": 3,
    "event_type": "MUN"
  }'
```

### 2. Bulk Import Certificates

```bash
curl -X POST http://localhost:3000/api/certificates/bulk-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d @examples/bulk-import-example.json
```

### 3. Export Certificate IDs and QR Codes

```bash
curl -X GET "http://localhost:3000/api/certificates/export/EVENT_ID" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

### 4. Verify a Certificate (Public, no auth)

```bash
curl http://localhost:3000/api/verify/igacmun-2025-osayeed-jaber-ijuw-hs
```

## API Authentication

Most endpoints require authentication. You need to:

1. Login via `/api/auth/login` to get a JWT token
2. Include the token in the `Authorization` header: `Bearer YOUR_TOKEN`

## Next Steps

- Build a frontend admin dashboard
- Build a public verification page
- Set up production deployment
- Configure your subdomain (verify.igac.info)

## Troubleshooting

### "Certificate not found" errors
- Make sure the event exists before importing certificates
- Check that the event_code matches exactly

### QR code upload fails
- Ensure the `qr-codes` storage bucket exists and is public
- Check that the service role key has proper permissions

### Authentication fails
- Verify your Supabase credentials in `.env.local`
- Check that the user account is approved (status = 'approved')

### Duplicate certificate IDs
- The system automatically appends a suffix if duplicates are detected
- Check the import response for the actual generated IDs

