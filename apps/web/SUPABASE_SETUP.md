# Supabase Setup & Integration Guide

This guide walks through setting up Supabase integration in the PayEasy project.

## Prerequisites

- A [Supabase account](https://supabase.com) (free tier is sufficient for development)
- Node.js 18+ installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in the project details:
   - **Name**: `payeasy` (or your preferred name)
   - **Database Password**: Create a secure password and save it
   - **Region**: Choose the region closest to you
4. Click **Create new project** and wait for it to initialize (takes ~2 minutes)

## Step 2: Get Credentials

Once your project is created:

1. In the Supabase dashboard, go to **Project Settings** → **API**
2. You'll see:
   - **Project URL** → Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Secret** → Copy this for `SUPABASE_SERVICE_ROLE_KEY` (keep secure!)

## Step 3: Configure Environment Variables

1. Create `.env.local` in `/apps/web/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stellar (already configured)
NEXT_PUBLIC_STELLAR_NETWORK=futurenet
```

2. **Never commit `.env.local`** (it's in `.gitignore`)
3. For production, add these to your deployment platform (Vercel, etc.)

## Step 4: Run Database Migrations

The project includes SQL migrations in `/migrations/`:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and run each migration file in order:
   - `001_create_tables.sql`
   - `002_seed_amenities.sql`
   - `003_create_indexes.sql`
   - `004_rls_policies.sql`
   - `005_create_triggers.sql`
   - `006_create_conversations.sql`
   - `007_conversation_indexes.sql`
   - `008_conversation_rls.sql`
   - `009_conversation_triggers_views.sql`

Alternatively, use Supabase CLI (advanced):
```bash
supabase db push
```

## Step 5: Enable Authentication Methods

In Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** (enabled by default)
3. Optionally enable **OAuth providers** (Google, GitHub, etc.)

## Step 6: Configure Email Templates (Optional)

For production email confirmations:

1. Go to **Authentication** → **Email Templates**
2. Customize templates as needed
3. Set your custom domain/SMTP settings

## File Structure

The integration uses these key files:

```
apps/web/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client (anon key, RLS-protected)
│   │   └── server.ts          # Server client (service role key, for admin)
│   └── hooks/
│       ├── useAuth.ts         # Auth hooks (useUser, useSignIn, useSignUp, etc.)
│       └── useSupabaseQuery.ts # Database query hooks
├── middleware.ts              # Auth middleware for route protection
├── .env.example              # Template for environment variables
└── migrations/               # Database schema and policies
```

## Usage Examples

### Client-Side Authentication

```tsx
'use client'
import { useUser, useSignIn, useSignOut } from '@/lib/hooks/useAuth'

export function MyComponent() {
  const { user, loading } = useUser()
  const { signIn } = useSignIn()
  const { signOut } = useSignOut()

  if (loading) return <p>Loading...</p>

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      signIn(
        formData.get('email') as string,
        formData.get('password') as string
      )
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

### Server-Side Database Operations

```typescript
// app/api/listings/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

### Client-Side Database Queries

```tsx
'use client'
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'

export function ListingsList() {
  const { data: listings, loading, error } = useSupabaseQuery(
    'listings',
    (q) => q.select('*').limit(10)
  )

  if (loading) return <p>Loading listings...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {listings.map((listing) => (
        <li key={listing.id}>{listing.title}</li>
      ))}
    </ul>
  )
}
```

## Row Level Security (RLS)

Database policies are defined in `004_rls_policies.sql`. By default:

- **Users can only see their own data**
- **Service role bypasses RLS** (use in server components/API routes)
- **Anon key respects RLS** (use in browser/client components)

Never expose the service role key to the client!

## Testing

Before deploying:

1. **Test authentication**: Sign up, sign in, sign out
2. **Test database operations**: Create, read, update, delete records
3. **Test RLS policies**: Verify users can't access other users' data
4. **Check browser console**: Look for error messages

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists in `/apps/web/`
- Check all three variables are set correctly
- Restart dev server after adding variables

### "Cannot insert row" or "Permission denied"
- Check RLS policies in `004_rls_policies.sql`
- Verify authenticated user exists
- For admin operations, use `createAdminClient()`

### "User session not persisting"
- Check auth cookies are not blocked by browser
- Verify middleware.ts is in correct location
- Try incognito mode to eliminate extensions

## Next Steps

1. Test the integration with your preferred client
2. Customize RLS policies for your data model
3. Set up real-time subscriptions for live updates
4. Configure production environment variables
5. Consider edge case handling and error states

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Auth Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
