-- Code Tales Full Database Schema Setup
-- Run this script on a fresh Supabase database to set up all tables
-- New Supabase Project: dngnmalbjapetqdafhvg
-- Generated: 2026-01-08

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================
-- Run this in Supabase Dashboard > Storage > New Bucket
-- Name: story-audio
-- Public: Yes

-- ============================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  preferences JSONB DEFAULT '{}',
  usage_quota JSONB DEFAULT '{"stories_per_month": 5, "minutes_per_month": 60}',
  stories_used_this_month INTEGER DEFAULT 0,
  minutes_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- CODE REPOSITORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.code_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  primary_language TEXT,
  stars_count INTEGER DEFAULT 0,
  description TEXT,
  analysis_cache JSONB,
  analysis_cached_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT code_repositories_repo_url_key UNIQUE (repo_url)
);

ALTER TABLE public.code_repositories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repos_select_all" ON public.code_repositories;
DROP POLICY IF EXISTS "repos_insert_all" ON public.code_repositories;
DROP POLICY IF EXISTS "repos_update_own" ON public.code_repositories;
DROP POLICY IF EXISTS "repos_delete_own" ON public.code_repositories;

-- Allow anonymous users to insert and select repos (for unauthenticated story generation)
CREATE POLICY "repos_select_all" ON public.code_repositories FOR SELECT USING (true);
CREATE POLICY "repos_insert_all" ON public.code_repositories FOR INSERT WITH CHECK (true);
CREATE POLICY "repos_update_own" ON public.code_repositories FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "repos_delete_own" ON public.code_repositories FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORY INTENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES public.code_repositories(id) ON DELETE CASCADE,
  intent_category TEXT NOT NULL CHECK (intent_category IN (
    'architecture_understanding',
    'onboarding_deep_dive',
    'specific_feature_focus',
    'code_review_prep',
    'learning_patterns',
    'api_documentation',
    'bug_investigation',
    'migration_planning',
    'quick_overview'
  )),
  user_description TEXT,
  focus_areas JSONB DEFAULT '[]',
  expertise_level TEXT DEFAULT 'intermediate' CHECK (expertise_level IN ('beginner', 'intermediate', 'expert')),
  conversation_history JSONB DEFAULT '[]',
  generated_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.story_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intents_select_own" ON public.story_intents;
DROP POLICY IF EXISTS "intents_insert_own" ON public.story_intents;
DROP POLICY IF EXISTS "intents_update_own" ON public.story_intents;
DROP POLICY IF EXISTS "intents_delete_own" ON public.story_intents;

CREATE POLICY "intents_select_own" ON public.story_intents FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "intents_insert_own" ON public.story_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "intents_update_own" ON public.story_intents FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "intents_delete_own" ON public.story_intents FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES public.story_intents(id) ON DELETE SET NULL,
  repository_id UUID REFERENCES public.code_repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  narrative_style TEXT NOT NULL CHECK (narrative_style IN ('fiction', 'documentary', 'tutorial', 'podcast', 'technical')),
  voice_id TEXT NOT NULL DEFAULT 'alloy',
  target_duration_minutes INTEGER,
  actual_duration_seconds INTEGER,
  expertise_level TEXT CHECK (expertise_level IN ('beginner', 'intermediate', 'expert')),
  script_text TEXT,
  audio_url TEXT,
  audio_chunks JSONB DEFAULT '[]',
  chapters JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'generating', 'synthesizing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  progress_message TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  share_id TEXT UNIQUE,
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  last_played_position INTEGER DEFAULT 0,
  generation_mode TEXT DEFAULT 'hybrid' CHECK (generation_mode IN ('hybrid', 'elevenlabs_studio')),
  elevenlabs_project_id TEXT,
  model_config JSONB DEFAULT '{}',
  generation_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_select_public" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_all" ON public.stories;
DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;

-- Allow public access for shared stories, anonymous insert for unauthenticated users
CREATE POLICY "stories_select_public" ON public.stories FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "stories_insert_all" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "stories_update_own" ON public.stories FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "stories_delete_own" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORY CHAPTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_time_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  script_segment TEXT,
  audio_url TEXT,
  focus_files JSONB DEFAULT '[]',
  key_concepts JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters_select" ON public.story_chapters;
DROP POLICY IF EXISTS "chapters_insert" ON public.story_chapters;
DROP POLICY IF EXISTS "chapters_update" ON public.story_chapters;
DROP POLICY IF EXISTS "chapters_delete" ON public.story_chapters;

CREATE POLICY "chapters_select" ON public.story_chapters FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND (s.user_id = auth.uid() OR s.is_public = TRUE OR s.user_id IS NULL)
  ));
CREATE POLICY "chapters_insert" ON public.story_chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "chapters_update" ON public.story_chapters FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  ));
CREATE POLICY "chapters_delete" ON public.story_chapters FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND s.user_id = auth.uid()
  ));

-- ============================================================
-- PROCESSING LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  level TEXT DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error'))
);

ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_all" ON public.processing_logs;
DROP POLICY IF EXISTS "logs_insert_all" ON public.processing_logs;
DROP POLICY IF EXISTS "logs_update_all" ON public.processing_logs;
DROP POLICY IF EXISTS "logs_delete_all" ON public.processing_logs;

-- Allow all access to processing logs (needed for API routes)
CREATE POLICY "logs_select_all" ON public.processing_logs FOR SELECT USING (true);
CREATE POLICY "logs_insert_all" ON public.processing_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "logs_update_all" ON public.processing_logs FOR UPDATE USING (true);
CREATE POLICY "logs_delete_all" ON public.processing_logs FOR DELETE USING (true);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_share_id ON public.stories(share_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_public ON public.stories(is_public);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_chapters_story_id ON public.story_chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_code_repositories_user_id ON public.code_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_code_repositories_repo_url ON public.code_repositories(repo_url);
CREATE INDEX IF NOT EXISTS idx_story_intents_user_id ON public.story_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_story_id ON public.processing_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_timestamp ON public.processing_logs(story_id, timestamp DESC);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Increment play count atomically
CREATE OR REPLACE FUNCTION increment_play_count(story_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories 
  SET play_count = COALESCE(play_count, 0) + 1,
      last_played_at = NOW()
  WHERE id = story_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO anon;

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================
-- Enable realtime for processing_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'processing_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE processing_logs;
  END IF;
END $$;

-- Enable realtime for stories table (for status updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories;
  END IF;
END $$;
