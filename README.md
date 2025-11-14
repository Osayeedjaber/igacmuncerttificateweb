# Certificate Management System

A secure backend system for tracking and verifying certificates for MUNs and other events, built with Next.js and Supabase.

## Features

- **Event Management**: Create and manage events (MUNs, BizCom, etc.)
- **Certificate Tracking**: Track certificates with unique IDs and QR codes
- **Bulk Import**: Import certificates from JSON (converted from Google Sheets)
- **Public Verification**: Verify certificates via QR code or certificate ID
- **Role-Based Access**: Super Admin, Admin, and Mod (read-only) roles
- **Analytics**: Track verifications and certificate statistics
- **Certificate Revocation**: Revoke certificates with reason tracking

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- npm or yarn

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Update the following variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for local)
- `NEXT_PUBLIC_VERIFY_URL`: Public verification URL (https://verify.igac.info for production)

### 4. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase/schema.sql` to create all tables and policies

### 5. Set Up Supabase Storage

Create the following storage buckets in Supabase:

1. **qr-codes** bucket:
   - Public bucket: Yes
   - Allowed MIME types: image/png
   - File size limit: 1MB

2. **certificates** bucket (optional, for PDF storage):
   - Public bucket: No (private)
   - Allowed MIME types: application/pdf
   - File size limit: 10MB

### 6. Create First Super Admin User

After setting up the database, you need to create your first super admin:

1. Sign up a user through Supabase Auth
2. In Supabase SQL Editor, run:

```sql
UPDATE public.users
SET role = 'super_admin', account_status = 'approved'
WHERE email = 'your-email@example.com';
```

Or insert directly if the user record doesn't exist:

```sql
INSERT INTO public.users (id, email, role, account_status)
SELECT id, email, 'super_admin', 'approved'
FROM auth.users
WHERE email = 'your-email@example.com';
```

### 7. Run the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Events

- `GET /api/events` - List all events
- `POST /api/events` - Create event (admin+)
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event (admin+)
- `DELETE /api/events/[id]` - Delete event (admin+)

### Certificates

- `GET /api/certificates` - List certificates (with filters)
- `POST /api/certificates` - Create certificate (admin+)
- `POST /api/certificates/bulk-import` - Bulk import from JSON (admin+)
- `GET /api/certificates/export/[eventId]` - Export certificate IDs and QR codes (admin+)
- `GET /api/certificates/[id]` - Get certificate details
- `PUT /api/certificates/[id]` - Update certificate (admin+)
- `POST /api/certificates/[id]/revoke` - Revoke certificate (admin+)
- `GET /api/certificates/[id]/qr-code` - Get QR code image

### Verification (Public)

- `GET /api/verify/[certificateId]` - Verify certificate (no auth required)

## Bulk Import JSON Format

```json
{
  "event_code": "igacmun-session-3-2025",
  "certificates": [
    {
      "certificate_type": "MUN Participant",
      "participant_name": "Osayeed Jaber",
      "school": "IJUW HS",
      "date_issued": "2025-03-15",
      "country": "United States",
      "committee": "UNSC",
      "custom_fields": {
        "award": "Best Delegate"
      }
    }
  ]
}
```

## Certificate ID Format

Certificates are automatically assigned IDs in the format:
```
{event-code}-{year}-{participant-name-slug}-{school-slug}
```

Example: `igacmun-2025-osayeed-jaber-ijuw-hs`

## Workflow

1. **Create Event**: Create an event first (e.g., "igacmun-session-3-2025")
2. **Bulk Import**: Upload JSON with certificate data
3. **Export IDs/QR Codes**: Download certificate IDs and QR codes for printing
4. **Print Certificates**: Print physical certificates with IDs and QR codes
5. **Public Verification**: Participants can verify certificates immediately
6. **Upload PDFs** (optional): Upload final PDFs later

## Certificate Types

### MUN Certificates
- MUN Participant
- Campus Ambassador
- Secretariat Board Member

Required fields: name, school, country, committee, date_issued

### BizCom Certificates
- BizCom Participant
- BizCom Winner

Required fields: name, school, segment, team_name, date_issued

### Special Mention
- Special Mention 1
- Special Mention 2
- Special Mention 3
- Special Mention 5

Required fields: name, school, date_issued

## User Roles

- **Super Admin**: Full access, can approve mod accounts
- **Admin**: Full access except user management
- **Mod**: Read-only access (view only, cannot edit)

## Admin Dashboard

Once you sign in via `/` (login screen), you’ll land in the protected `/dashboard`.

Features:

- **Event creator** – publish new sessions with event codes, year, month, and type.
- **JSON bulk import** – upload or paste the Apps Script JSON dump; IDs and QR codes are minted immediately.
- **Recent certificates table** – quick view of the latest IDs, events, and statuses.
- **Stats grid** – high-level metrics (events, certificates, revocations, verification hits).
- **Sign out** button – clears the Supabase session cookie.

If you prefer to pre-stage JSON files before uploading, drop them in the `imports/` folder (not auto-imported, just storage).

## Security

- Row Level Security (RLS) enabled on all tables
- Public read access for verification
- Admin-only write access
- Service role key used only server-side

## License

Private project
