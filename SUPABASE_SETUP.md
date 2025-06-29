# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New project"
4. Fill in:
   - Project name: `sticky-lite` (or your preferred name)
   - Database Password: (generate a strong password)
   - Region: Choose the closest to your users
5. Click "Create new project"

## 2. Get Your API Credentials

After project creation:
1. Go to Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Replace the placeholder values with your actual credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Run Database Migration

1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration

## 5. Enable Authentication

1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure email templates if desired

## 6. Test the Setup

1. Start your development server: `pnpm dev`
2. Go to `/login`
3. Create a new account
4. You should be able to:
   - Create and share boards
   - Add sticky notes
   - See real-time updates when multiple users edit the same board

## Troubleshooting

### Authentication Issues
- Check that your Supabase URL and anon key are correct
- Ensure the Email provider is enabled in Supabase

### Database Issues
- Verify the migration ran successfully
- Check RLS policies are enabled on all tables
- Look at the Supabase logs for any errors

### Real-time Not Working
- Ensure you're using the correct board ID
- Check browser console for WebSocket errors
- Verify real-time is enabled in Supabase settings