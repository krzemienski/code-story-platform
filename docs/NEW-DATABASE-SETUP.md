# New Supabase Database Setup Guide

## New Project Details
- **Project ID**: `dngnmalbjapetqdafhvg`
- **URL**: `https://dngnmalbjapetqdafhvg.supabase.co`
- **Region**: us-west-2

## Setup Steps

### Step 1: Run the Schema Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dngnmalbjapetqdafhvg/sql)
2. Open the SQL Editor
3. Copy the contents of `scripts/000_full_schema_setup.sql`
4. Run the SQL script

### Step 2: Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New Bucket"
3. Name: `story-audio`
4. Check "Public bucket"
5. Click "Create bucket"

### Step 3: Configure Storage Policies

Run this SQL in the SQL Editor:

```sql
-- Allow public read access to story-audio bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-audio');

-- Allow authenticated and anon users to upload
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-audio');

-- Allow users to update their own files
CREATE POLICY "Allow updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'story-audio');
```

### Step 4: Verify Environment Variables

Ensure these are set in v0/Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://dngnmalbjapetqdafhvg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from credentials)
- `SUPABASE_SERVICE_ROLE_KEY` = (from credentials - for server-side operations)

### Step 5: Test the Setup

1. Visit the app and try to sign up
2. Try generating a story
3. Check the dashboard

## Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles extending auth.users |
| `code_repositories` | GitHub repositories analyzed |
| `story_intents` | User learning goals |
| `stories` | Generated audio stories |
| `story_chapters` | Chapter metadata |
| `processing_logs` | Real-time generation logs |

## RLS Policies

All tables have Row Level Security enabled with appropriate policies:
- Anonymous users can create stories and repositories
- Public stories are viewable by everyone
- Users can only modify their own content
- Processing logs are accessible for API routes
