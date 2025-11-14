# Setup Secrets in Supabase

After running the schema migration, you need to initialize the secrets table with the passwords.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor** → **secrets** table
3. Insert the following records:

**Record 1:**
- `key`: `signup_password`
- `value`: `igac5889@`
- `description`: `Password required for sign-up requests`

**Record 2:**
- `key`: `role_change_password`
- `value`: `osayeedjaber5889@`
- `description`: `Password required to change user role to admin or super_admin`

## Option 2: Using SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
INSERT INTO public.secrets (key, value, description)
VALUES 
    ('signup_password', 'igac5889@', 'Password required for sign-up requests'),
    ('role_change_password', 'osayeedjaber5889@', 'Password required to change user role to admin or super_admin')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();
```

## Option 3: Using API Endpoint (One-time)

You can call the initialization endpoint once (make sure to protect it or delete it after):

```bash
curl -X POST http://localhost:3000/api/secrets/init
```

**Note:** After initialization, you may want to delete or protect the `/api/secrets/init` endpoint.

## Security Notes

- The secrets table is protected by RLS (Row Level Security)
- Only super admins can view/update secrets
- Passwords are stored in plain text in the database (you may want to hash them in the future)
- Keep your Supabase service role key secure

