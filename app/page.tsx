import { createClient } from "@/lib/supabase/server"
import { Code, Users, Plus, BookOpen, Headphones, Mic, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { FeaturedHero } from "@/components/featured-hero"
import { ChronicleCard } from "@/components/chronicle-card"
import { ParallaxBackground } from "@/components/parallax-background"
import { TaliMascot } from "@/components/tali-mascot"
import { Logo } from "@/components/logo"

async function getPublicStories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      narrative_style,
      actual_duration_seconds,
      created_at,
      play_count,
      audio_url,
      audio_chunks,
      code_repositories (
        repo_name,
        repo_owner,
        primary_language,
        stars_count,
        description
      )
    `)
    .eq("status", "completed")
    .eq("is_public", true)
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(10)

  return data || []
}

async function getFeaturedStories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      actual_duration_seconds,
      audio_url,
      audio_chunks,
      code_repositories (
        repo_name,
        repo_owner,
        primary_language,
        description
      )
    `)
    .eq("status", "completed")
    .eq("is_public", true)
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(3)

  return (data || []).map((story) => ({
    id: story.id,
    title: story.title,
    description: story.code_repositories?.description || undefined,
    repo_owner: story.code_repositories?.repo_owner || undefined,
    repo_name: story.code_repositories?.repo_name || undefined,
    primary_language: story.code_repositories?.primary_language || undefined,
    actual_duration_seconds: story.actual_duration_seconds || undefined,
    audio_url: story.audio_url || undefined,
    audio_chunks: story.audio_chunks || undefined,
  }))
}

export default async function HomePage() {
  const [stories, featuredStories] = await Promise.all([getPublicStories(), getFeaturedStories()])

  return (
    <div className="min-h-screen bg-background relative">
      <ParallaxBackground />

      <Navbar />

      <main>
        {/* Hero Section with Mascot and Create Your Own */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <TaliMascot size="lg" speaking mood="excited" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif mb-4">
                Your Code Has a <span className="text-primary italic">Story</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Transform any GitHub repository into an immersive audio experience. Listen like a podcast, read like a
                book, or explore with AI-narrated tales.
              </p>

              {/* How It Works Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
                  <Code className="h-4 w-4 text-primary" />
                  <span className="text-sm">Paste a GitHub URL</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">AI analyzes the code</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
                  <Headphones className="h-4 w-4 text-primary" />
                  <span className="text-sm">Listen to your tale</span>
                </div>
              </div>
            </div>

            <FeaturedHero stories={featuredStories} />
          </div>
        </section>

        {/* How It Works - Detailed Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border bg-card/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">How Code Tales Works</h2>
              <p className="text-muted-foreground">From repository to audio story in minutes</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Book-like Experience */}
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Book Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Get a comprehensive narrative with chapters covering architecture, design patterns, and the evolution
                  of the codebase.
                </p>
              </div>

              {/* Podcast Experience */}
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Podcast Style</h3>
                <p className="text-sm text-muted-foreground">
                  Quick, digestible episodes perfect for commutes. Learn about repositories while on the go.
                </p>
              </div>

              {/* Fictional Narrative */}
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Fictional Tales</h3>
                <p className="text-sm text-muted-foreground">
                  Experience code as an adventure story with heroes, challenges, and triumphs - perfect for creative
                  learning.
                </p>
              </div>
            </div>

            {/* Self-hosting note */}
            <div className="mt-12 text-center p-6 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Self-hosted & Open Source</span> — Deploy your own instance
                with full control. Scale to thousands of tales with your infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* Stories Section - Renamed from "Chronicles" to "Code Tales" */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Community Tales</h2>
                <p className="text-muted-foreground">Discover the stories woven within open source projects.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center rounded-lg border border-border bg-card/50 p-1">
                  <button className="p-1.5 rounded bg-secondary text-foreground">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button className="p-1.5 rounded text-muted-foreground hover:text-foreground">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                </div>

                <Button variant="outline" size="sm" className="gap-2 bg-transparent border-border">
                  Filters
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Stories list */}
            {stories.length > 0 ? (
              <div className="space-y-4">
                {stories.map((story) => (
                  <ChronicleCard key={story.id} story={story} variant="list" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tales yet. Be the first to create one!</p>
              </div>
            )}

            {/* Submit CTA */}
            <div className="flex flex-col items-center justify-center py-12 mt-8 border-t border-border">
              <div className="h-12 w-12 rounded-full border border-dashed border-border flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Submit Your Tale</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Open a PR to add your generated tale to the collection.
              </p>
              <Button variant="outline" className="bg-transparent border-border" asChild>
                <Link href="/discover">Load More Tales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-card/30 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-medium">Open Source</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-semibold mb-2">Built by developers,</h2>
            <p className="text-3xl sm:text-4xl font-serif italic text-muted-foreground mb-6">for the love of code.</p>

            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Code Tales is fully open source. We believe that software architecture is an art form deserving of new
              mediums of expression. Contribute to the engine, improve the audio generation, or expand the collection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="outline" className="gap-2 bg-transparent border-border" asChild>
                <a href="https://github.com/krzemienski/code-story-platform" target="_blank" rel="noopener noreferrer">
                  <Code className="h-4 w-4" />
                  View Source on GitHub
                </a>
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent border-border" asChild>
                <a href="https://discord.gg/codetales" target="_blank" rel="noopener noreferrer">
                  <Users className="h-4 w-4" />
                  Join Discord Community
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" animated />

          <p className="text-xs text-muted-foreground">© 2025 Code Tales. Licensed under MIT. The code is open.</p>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <a
              href="https://github.com/krzemienski/code-story-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
