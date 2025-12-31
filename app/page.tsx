import { createClient } from "@/lib/supabase/server"
import { Code, Users, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { FeaturedHero } from "@/components/featured-hero"
import { ChronicleCard } from "@/components/chronicle-card"
import { ParallaxBackground } from "@/components/parallax-background"

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
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <FeaturedHero stories={featuredStories} />
          </div>
        </section>

        {/* Stories Section - Renamed from "Chronicles" to "Code Stories" */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Code Stories</h2>
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
                <p>No stories yet. Be the first to create one!</p>
              </div>
            )}

            {/* Submit CTA */}
            <div className="flex flex-col items-center justify-center py-12 mt-8 border-t border-border">
              <div className="h-12 w-12 rounded-full border border-dashed border-border flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Submit Your Story</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Open a PR to add your generated story to the collection.
              </p>
              <Button variant="outline" className="bg-transparent border-border" asChild>
                <Link href="/discover">Load More Stories</Link>
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
              Code Story is fully open source. We believe that software architecture is an art form deserving of new
              mediums of expression. Contribute to the engine, improve the audio generation, or expand the collection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="outline" className="gap-2 bg-transparent border-border" asChild>
                <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                  <Code className="h-4 w-4" />
                  View Source on GitHub
                </a>
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent border-border" asChild>
                <a href="https://discord.gg/codestory" target="_blank" rel="noopener noreferrer">
                  <Users className="h-4 w-4" />
                  Join Discord Community
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Removed API link */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
              <path d="M12 2L22 12L12 22L2 12L12 2Z" />
            </svg>
            <span className="font-semibold text-sm">
              Code<span className="text-primary">Story</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground">© 2025 Code Story. Licensed under MIT. The code is open.</p>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <a
              href="https://github.com/codestory/codestory"
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
