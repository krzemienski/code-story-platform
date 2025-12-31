// Demo mode utilities for testing without authentication

export const DEMO_USER = {
  id: "demo-user-id",
  email: "demo@codestory.dev",
  user_metadata: {
    name: "Demo User",
  },
}

export const DEMO_PROFILE = {
  id: "demo-user-id",
  email: "demo@codestory.dev",
  name: "Demo User",
  avatar_url: null,
  subscription_tier: "free",
  stories_used_this_month: 2,
  minutes_used_this_month: 28,
  usage_quota: {
    stories_per_month: 5,
    minutes_per_month: 60,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const DEMO_STORIES = [
  {
    id: "demo-story-1",
    user_id: "demo-user-id",
    repository_id: "demo-repo-1",
    title: "React: Understanding the Virtual DOM",
    narrative_style: "documentary",
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    target_duration_minutes: 15,
    actual_duration_seconds: 892,
    expertise_level: "intermediate",
    status: "completed",
    progress: 100,
    progress_message: "Complete",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    transcript: "Welcome to Code Story. Today we're exploring React, one of the most popular JavaScript libraries...",
    play_count: 3,
    last_played_position: 245,
    is_public: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    repository: {
      repo_name: "react",
      repo_owner: "facebook",
      primary_language: "JavaScript",
      stars_count: 220000,
      description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
    },
  },
  {
    id: "demo-story-2",
    user_id: "demo-user-id",
    repository_id: "demo-repo-2",
    title: "Next.js: Server Components Deep Dive",
    narrative_style: "tutorial",
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    target_duration_minutes: 20,
    actual_duration_seconds: 1247,
    expertise_level: "expert",
    status: "completed",
    progress: 100,
    progress_message: "Complete",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    transcript: "In this deep dive, we'll explore how Next.js Server Components revolutionize React development...",
    play_count: 7,
    last_played_position: 0,
    is_public: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    repository: {
      repo_name: "next.js",
      repo_owner: "vercel",
      primary_language: "TypeScript",
      stars_count: 118000,
      description: "The React Framework for the Web",
    },
  },
  {
    id: "demo-story-3",
    user_id: "demo-user-id",
    repository_id: "demo-repo-3",
    title: "Prisma: Database Made Simple",
    narrative_style: "podcast",
    voice_id: "MF3mGyEYCl7XYWbV9V6O",
    target_duration_minutes: 10,
    actual_duration_seconds: null,
    expertise_level: "beginner",
    status: "generating",
    progress: 45,
    progress_message: "Generating audio narration...",
    audio_url: null,
    transcript: null,
    play_count: 0,
    last_played_position: 0,
    is_public: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repository: {
      repo_name: "prisma",
      repo_owner: "prisma",
      primary_language: "TypeScript",
      stars_count: 36000,
      description: "Next-generation ORM for Node.js & TypeScript",
    },
  },
]

export const DEMO_CHAPTERS = [
  {
    id: "chapter-1",
    story_id: "demo-story-1",
    chapter_number: 1,
    title: "Introduction to React",
    start_time_seconds: 0,
    end_time_seconds: 120,
    summary: "An overview of what React is and why it matters in modern web development.",
    created_at: new Date().toISOString(),
  },
  {
    id: "chapter-2",
    story_id: "demo-story-1",
    chapter_number: 2,
    title: "The Virtual DOM Explained",
    start_time_seconds: 120,
    end_time_seconds: 340,
    summary: "Understanding how React's Virtual DOM optimizes rendering performance.",
    created_at: new Date().toISOString(),
  },
  {
    id: "chapter-3",
    story_id: "demo-story-1",
    chapter_number: 3,
    title: "Component Architecture",
    start_time_seconds: 340,
    end_time_seconds: 560,
    summary: "How React components are structured and composed together.",
    created_at: new Date().toISOString(),
  },
  {
    id: "chapter-4",
    story_id: "demo-story-1",
    chapter_number: 4,
    title: "State and Props",
    start_time_seconds: 560,
    end_time_seconds: 720,
    summary: "Managing data flow in React applications with state and props.",
    created_at: new Date().toISOString(),
  },
  {
    id: "chapter-5",
    story_id: "demo-story-1",
    chapter_number: 5,
    title: "Hooks and Modern React",
    start_time_seconds: 720,
    end_time_seconds: 892,
    summary: "The introduction of hooks and how they changed React development.",
    created_at: new Date().toISOString(),
  },
]

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return document.cookie.includes("codestory_demo=true")
}

export function setDemoMode(enabled: boolean): void {
  if (enabled) {
    document.cookie = "codestory_demo=true; path=/; max-age=86400" // 24 hours
  } else {
    document.cookie = "codestory_demo=; path=/; max-age=0"
  }
}
