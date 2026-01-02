export type SubscriptionTier = "free" | "pro" | "team"
export type ExpertiseLevel = "beginner" | "intermediate" | "expert"
export type NarrativeStyle = "fiction" | "documentary" | "tutorial" | "podcast" | "technical"
export type StoryStatus = "pending" | "analyzing" | "generating" | "synthesizing" | "completed" | "failed"
export type IntentCategory =
  | "architecture_understanding"
  | "onboarding_deep_dive"
  | "specific_feature_focus"
  | "code_review_prep"
  | "learning_patterns"
  | "api_documentation"
  | "bug_investigation"
  | "migration_planning"
  | "quick_overview"

export interface Profile {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  preferences: Record<string, unknown>
  usage_quota: {
    stories_per_month: number
    minutes_per_month: number
  }
  stories_used_this_month: number
  minutes_used_this_month: number
  created_at: string
  updated_at: string
}

export interface CodeRepository {
  id: string
  user_id: string
  repo_url: string
  repo_name: string
  repo_owner: string
  primary_language: string | null
  stars_count: number
  description: string | null
  analysis_cache: Record<string, unknown> | null
  analysis_cached_at: string | null
  created_at: string
}

export interface StoryIntent {
  id: string
  user_id: string
  repository_id: string | null
  intent_category: IntentCategory
  user_description: string | null
  focus_areas: string[]
  expertise_level: ExpertiseLevel
  conversation_history: ConversationMessage[]
  generated_plan: StoryPlan | null
  created_at: string
}

export interface ConversationMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface StoryPlan {
  title: string
  estimated_duration_minutes: number
  chapters: ChapterPlan[]
  narrative_style: NarrativeStyle
  voice_recommendation: string
}

export interface ChapterPlan {
  number: number
  title: string
  duration_minutes: number
  focus_files: string[]
  key_concepts: string[]
}

export interface Story {
  id: string
  user_id: string
  intent_id: string | null
  repository_id: string | null
  title: string
  narrative_style: NarrativeStyle
  voice_id: string
  target_duration_minutes: number | null
  actual_duration_seconds: number | null
  expertise_level: ExpertiseLevel | null
  script_text: string | null
  audio_url: string | null
  chapters: StoryChapter[]
  status: StoryStatus
  progress: number
  progress_message: string | null
  processing_started_at: string | null
  processing_completed_at: string | null
  error_message: string | null
  is_public: boolean
  share_id: string | null
  play_count: number
  last_played_at: string | null
  last_played_position: number
  created_at: string
  updated_at: string
  repository?: CodeRepository
}

export interface StoryChapter {
  id: string
  story_id: string
  chapter_number: number
  title: string
  start_time_seconds: number
  duration_seconds: number | null
  script_segment: string | null
  audio_url: string | null
  focus_files: string[]
  key_concepts: string[]
}

export interface PopularRepo {
  owner: string
  name: string
  stars: string
  language: string
  url: string
}
