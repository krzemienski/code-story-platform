import { createClient } from "@/lib/supabase/server"
import { Code, Users, Plus, Mic, Sparkles, Film, GraduationCap, Cpu } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TalesCarousel } from "@/components/tales-carousel"
import { ChronicleCard } from "@/components/chronicle-card"
import { ParallaxBackground } from "@/components/parallax-background"
import { Logo } from "@/components/logo"

async function getPublicTales() {
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
    .eq("status", "complete")
    .eq("is_public", true)
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(12)

  return data || []
}

async function getFeaturedTales() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      narrative_style,
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
    .eq("status", "complete")
    .eq("is_public", true)
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(5)

  return data || []
}

export default async function HomePage() {
  const [tales, featuredTales] = await Promise.all([getPublicTales(), getFeaturedTales()])

  return (
    <div className="min-h-screen bg-background relative">
      <ParallaxBackground />

      <Navbar />

      <main>
        {/* Full-screen Hero Section */}
        <HeroSection />

        {/* Featured Tales Carousel - Fixed "Tails" to "Tales" */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Featured Tales</span>
            </div>

            <TalesCarousel tales={featuredTales} />
          </div>
        </section>

        {/* Tale Types Explanation - Fixed "Tail" to "Tale" */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border bg-card/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Choose Your Experience</h2>
              <p className="text-muted-foreground">Every tale can be generated in different formats</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Podcast Style */}
              <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                  <Mic className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-purple-400 mb-1">Podcast</h3>
                <p className="text-xs text-muted-foreground">Conversational, engaging episodes perfect for commutes</p>
              </div>

              {/* Documentary Style */}
              <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                  <Film className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-blue-400 mb-1">Documentary</h3>
                <p className="text-xs text-muted-foreground">In-depth exploration of architecture and history</p>
              </div>

              {/* Fiction Style */}
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-amber-400 mb-1">Fiction</h3>
                <p className="text-xs text-muted-foreground">Code as adventure with heroes and challenges</p>
              </div>

              {/* Tutorial Style */}
              <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30 hover:border-green-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                  <GraduationCap className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-green-400 mb-1">Tutorial</h3>
                <p className="text-xs text-muted-foreground">Step-by-step learning with clear explanations</p>
              </div>

              {/* Technical Style */}
              <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3">
                  <Cpu className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-red-400 mb-1">Technical</h3>
                <p className="text-xs text-muted-foreground">Deep-dive into implementation details</p>
              </div>
            </div>
          </div>
        </section>

        {/* All Tales List - Fixed "Tails" to "Tales" throughout */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Community Tales</h2>
                <p className="text-muted-foreground">Explore the tales woven from open source projects</p>
              </div>

              <div className="flex items-center gap-2">
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

            {tales.length > 0 ? (
              <div className="space-y-4">
                {tales.map((tale) => (
                  <ChronicleCard key={tale.id} story={tale} variant="list" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tales yet. Be the first to generate one!</p>
              </div>
            )}

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

        {/* Open Source Section - Fixed "tails" to "tales" */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-card/30 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-medium">Open Source</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-semibold mb-2">Built for self-hosting,</h2>
            <p className="text-3xl sm:text-4xl font-serif italic text-muted-foreground mb-6">ready to scale.</p>

            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Code Tales is designed to run on your infrastructure. Deploy your own instance, generate thousands of
              tales, and maintain full control over your data and audio generation pipeline.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
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
