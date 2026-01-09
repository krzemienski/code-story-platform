# Supabase Reconnection Guide

## Current Issue

The Supabase project `ffydbczyafseklsthhdo` is **not found**. This causes:
- Database connection timeouts
- Authentication failures ("Failed to fetch")
- Story generation failures
- Dashboard inaccessible

## Resolution Steps

### Step 1: Reconnect Supabase in v0

1. Open the **Connect** section in the v0 sidebar (left side)
2. Click on **Supabase** integration
3. Either:
   - **Create a new project** - v0 will provision a new Supabase project
   - **Connect existing project** - If you have another Supabase project to use

### Step 2: Run Database Migrations

After connecting, run these SQL scripts in order via v0 or Supabase Dashboard:

1. `scripts/001_create_codestory_tables.sql` - Creates core tables (profiles, code_repositories, stories)
2. `scripts/002_add_model_config.sql` - Adds model configuration columns
3. `scripts/003_add_generation_mode.sql` - Adds generation mode support
4. `scripts/004_add_elevenlabs_project_id.sql` - Adds ElevenLabs project tracking
5. `scripts/005_add_audio_chunks.sql` - Adds audio chunk storage
6. `scripts/006_create_processing_logs.sql` - Creates processing logs table
7. `scripts/007_fix_processing_logs_rls.sql` - Fixes RLS policies
8. `scripts/008_create_increment_play_count.sql` - Creates play count function
9. `scripts/009_add_unique_repo_url.sql` - Adds unique constraint on repo URLs

### Step 3: Create Storage Bucket

Run this SQL to create the audio storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-audio', 'story-audio', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 4: Verify Environment Variables

After reconnecting, these should be automatically set:
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Test the Application

1. **Test Auth**: Go to `/auth/login` and try signing up
2. **Test Dashboard**: After login, access `/dashboard`
3. **Test Generation**: Try generating a tale from the homepage

## Quick Verification Query

After setup, run this to verify all tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `code_repositories`
- `processing_logs`
- `profiles`
- `stories`
