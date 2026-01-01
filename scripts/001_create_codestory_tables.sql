-- Code Story Database Schema
-- Creates all necessary tables for the Code Story platform

-- Users profile table (extends auth.users)
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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Repositories table
CREATE TABLE IF NOT EXISTS public.code_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  primary_language TEXT,
  stars_count INTEGER DEFAULT 0,
  description TEXT,
  analysis_cache JSONB,
  analysis_cached_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on repositories
ALTER TABLE public.code_repositories ENABLE ROW LEVEL SECURITY;

-- Repositories RLS policies
CREATE POLICY "repos_select_own" ON public.code_repositories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "repos_insert_own" ON public.code_repositories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "repos_update_own" ON public.code_repositories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "repos_delete_own" ON public.code_repositories FOR DELETE USING (auth.uid() = user_id);

-- Story intents table (captures user's learning goals)
CREATE TABLE IF NOT EXISTS public.story_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS on story_intents
ALTER TABLE public.story_intents ENABLE ROW LEVEL SECURITY;

-- Story intents RLS policies
CREATE POLICY "intents_select_own" ON public.story_intents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "intents_insert_own" ON public.story_intents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "intents_update_own" ON public.story_intents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "intents_delete_own" ON public.story_intents FOR DELETE USING (auth.uid() = user_id);

-- Stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  chapters JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'generating', 'synthesizing', 'complete', 'failed')),
  progress INTEGER DEFAULT 0,
  progress_message TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_id TEXT UNIQUE,
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  last_played_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories RLS policies (allow public access for shared stories)
CREATE POLICY "stories_select_own" ON public.stories FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "stories_insert_own" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_update_own" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stories_delete_own" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story chapters table
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

-- Enable RLS on story_chapters
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

-- Chapters RLS policies (inherit from parent story)
CREATE POLICY "chapters_select" ON public.story_chapters FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND (s.user_id = auth.uid() OR s.is_public = TRUE)
  ));
CREATE POLICY "chapters_insert" ON public.story_chapters FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "chapters_update" ON public.story_chapters FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "chapters_delete" ON public.story_chapters FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_id AND s.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_share_id ON public.stories(share_id);
CREATE INDEX IF NOT EXISTS idx_story_chapters_story_id ON public.story_chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_code_repositories_user_id ON public.code_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_intents_user_id ON public.story_intents(user_id);
