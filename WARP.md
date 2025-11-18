# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

All commands are intended to be run from the repository root.

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

The app (including API routes) will be available at `http://localhost:3000`.

### Build for production

```bash
npm run build
```

### Start the production server

```bash
npm run start
```

### Lint the codebase

```bash
npm run lint
```

### Run a single Next.js route or component in isolation

This project does not define a custom test runner. To work on a specific route or component, hit the corresponding URL while `npm run dev` is running, for example:

- Public verification page: `http://localhost:3000/verify/{certificateId}`
- Admin dashboard: `http://localhost:3000/admin/dashboard`
- Main dashboard: `http://localhost:3000/dashboard`

When editing API routes under `app/api/**`, you can trigger a single route by calling its HTTP endpoint (e.g., via curl or a REST client).

## High-Level Architecture

This is a Next.js App Router project backed by Supabase for auth, database, and storage. It implements a certificate management backend with a protected admin dashboard and public verification endpoints.

### Top-level structure

- `app/` – Next.js App Router entrypoint, including public pages, admin dashboard, and API routes.
- `components/` – Reusable React components, including the dashboard UI, forms, and utility components.
- `lib/` – Server/client utilities, including Supabase clients, authentication helpers, certificate ID generation, QR code helpers, and validation.
- `supabase/` – SQL schema, migrations, and constraints defining all tables, indexes, and RLS policies.
- `types/` – Generated Supabase database typings used by the Supabase clients.
- `examples/` – Example payloads (e.g., bulk import JSON format).
- `imports/` – Local staging directory for bulk-import JSON files (not auto-imported by the app).

### Supabase integration

Supabase is the source of truth for users, events, certificates, and analytics.

- `lib/supabase/server.ts` – Creates a server-side Supabase client bound to Next.js `cookies` for auth. Use this in server components and API routes when you need to respect the authenticated user.
- `lib/supabase/client.ts` – Creates a browser Supabase client for client components.
- `lib/supabase/admin.ts` – Creates a service-role Supabase client for privileged operations (no session, no auto-refresh). This should only be used in server-side contexts that never expose the service role key to the browser.
- `supabase/schema.sql` – Defines:
  - `public.users` table extending `auth.users` with `role` (`super_admin`, `admin`, `mod`) and `account_status` (`pending_approval`, `approved`, `rejected`).
  - `public.events`, `public.certificates`, `public.certificate_metadata`, `public.verification_logs`, and `public.analytics` tables.
  - RLS policies enforcing:
    - Public read access to events and certificates needed for verification.
    - Admin-only creation and updates for events and certificates.
    - Restricted access to secrets and analytics to approved admins/super-admins.
  - A trigger `on_auth_user_created` that auto-creates a `public.users` row with role `mod` and `pending_approval` status on signup.

When modifying backend behavior, prefer updating `schema.sql` and using Supabase migrations (`supabase/migrations/**`) to keep schema changes consistent.

### Authentication and authorization

Auth and role checks are centralized in `lib/utils/auth.ts`:

- `getCurrentUser()` – Reads the Supabase auth user and augments it with `igac-role` and `igac-status` values from cookies. Returns `null` if the user is unauthenticated, missing a role, or not `approved`.
- `requireAuth(requiredRole?)` – Server-side guard that redirects to `/admin/login` if the user is not authenticated or does not meet the required role level. Role hierarchy is `mod < admin < super_admin`.
- `requireAdmin()` / `requireSuperAdmin()` – Convenience wrappers around `requireAuth` for admin-only and super-admin-only paths.
- `createUserRecord()` – Helper to insert a new row into `public.users` with a default `mod` role and `pending_approval` status.

Admin layouts such as `app/dashboard/layout.tsx` and `app/admin/dashboard/layout.tsx` call `requireAdmin()` to enforce access control and to pass the current user’s email/role into the sidebar.

When adding new admin pages or API routes, use these helpers so that all access control flows through the same logic.

### Certificate modeling and IDs

Certificates are modeled as a core record plus flexible metadata:

- `public.certificates` – Stores core attributes such as `certificate_id`, `event_id`, `certificate_type`, `participant_name`, `school`, `date_issued`, status, QR code data/image paths, and verification counters.
- `public.certificate_metadata` – Stores arbitrary key/value metadata for each certificate (e.g., committee, award, segment, team_name), with a uniqueness constraint per `certificate_id + field_name`.
- `lib/utils/certificate-id.ts` – Generates short, human-readable certificate IDs:
  - `generateCertificateId()` builds a hash from event code, year, participant name, school, and random data to produce a 6–8 character base36 ID.
  - `ensureUniqueCertificateId()` checks Supabase for collisions and appends a numeric suffix if needed.

When introducing new certificate types or metadata fields, prefer storing flexible fields in `certificate_metadata` rather than altering the main `certificates` table unless absolutely necessary.

### HTTP API and routing

All HTTP endpoints are implemented as App Router Route Handlers under `app/api/**`.

Key areas:

- `app/api/events/**` – CRUD for events.
- `app/api/certificates/**` – CRUD for certificates, bulk import, export, QR code generation, metadata retrieval, and revocation.
- `app/api/verify/[certificateId]/route.ts` – Public certificate verification by ID.
- `app/api/auth/**` – Login, logout, current-user (`me`), and access request endpoints.
- `app/api/users/**` – Admin endpoints for approving/rejecting users and changing roles.
- `app/api/incoming-certificates/**` – APIs for handling inbound certificate data and exports.
- `app/api/secrets/init/route.ts` – Initialization endpoint for secrets (relies on `public.secrets`).

These routes generally:

1. Use `createClient()` or `createAdminClient()` to talk to Supabase.
2. Apply auth/role checks via `requireAuth` or related helpers as needed.
3. Read/write `events`, `certificates`, and related tables according to the RLS policies.

When adding or adjusting behavior, maintain this pattern and ensure any privileged operations either run in a properly authorized Supabase context or use the admin client in a server-only environment.

### Admin dashboard and UI components

The admin UI lives primarily under `app/dashboard/**` and `app/admin/dashboard/**` with supporting components in `components/dashboard/**`.

- Layouts (`layout.tsx`) provide the shared shell: sidebar navigation, keyboard shortcuts, toast notifications, and base styling.
- Key components include:
  - `EventManager` – event creation and management.
  - `BulkImportUploader` – upload JSON for bulk certificate creation.
  - `RecentCertificates`, `CertificatesList`, `CertificateDetailView` – certificate browsing and inspection.
  - `StatsGrid`, `AnalyticsChart`, `ActivityFeed` – high-level analytics and recent activity.
  - `UserManagement`, `RoleChangeDialog`, `CertificateStatusBadge` – user and certificate status controls.

When building new dashboard features, follow the existing pattern:

- Define a route under `app/dashboard/**` or `app/admin/dashboard/**`.
- Implement the screen using `components/dashboard/**` primitives.
- Integrate with Supabase through `lib/supabase/*` and reuse validation from `lib/validations/**` where appropriate.

### Bulk import workflow

Bulk import is designed to ingest certificate data from Google Sheets/Apps Script as JSON.

- Example payload: `examples/bulk-import-example.json` (also documented in `README.md`).
- API endpoint: `POST /api/certificates/bulk-import`.
- Local staging directory: `imports/` (described in `imports/README.md`), where operators may store per-event JSON files prior to uploading.

When modifying the bulk import logic, ensure it remains compatible with the documented JSON schema (event_code + certificates array) and that it correctly generates IDs, QR codes, and metadata records.

## Notes for Future Warp Agents

- Treat Supabase as the canonical backend; prefer SQL migrations and updates to `supabase/schema.sql` over ad-hoc table changes.
- Centralize auth and role logic via `lib/utils/auth.ts` and reuse `requireAdmin`/`requireSuperAdmin` when adding new protected routes.
- For certificate-related changes, consider both `public.certificates` and `public.certificate_metadata` and keep the short, human-friendly ID behavior intact.
