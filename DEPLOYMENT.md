# Deployment Guide

## Vercel Deployment

### Environment Variables

This application requires the following environment variables to be set in your Vercel project:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### Important Notes

- The application will work without Supabase (using local storage only)
- With Supabase configured, users can create accounts and share boards
- Make sure to set up the database schema as described in the main README

## Local Development

For local development, create a `.env.local` file with the same variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```