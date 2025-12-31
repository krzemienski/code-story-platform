import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Github, Headphones, Code, Zap, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoryGenerator } from "@/components/story-generator"
import { PublicStoryCard } from "@/components/public-story-card"

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
      code_repositories (
        repo_name,
        repo_owner,
        primary_language,
        stars_count
      )
    `)
    .eq("status", "completed")
    .eq("is_public", true)
    .order("play_count", { ascending: false })
    .limit(12)

  return data || []
}

export default async function HomePage() {
  const stories = await getPublicStories()

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Headphones className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Code Story</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero + Generator Section */}
        <section className="relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                100% Open Source
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Turn any codebase into an
                <span className="text-primary block sm:inline"> audio story</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Paste a GitHub URL. Get a narrated explanation. Listen while commuting, exercising, or doing chores. No
                signup required.
              </p>
            </div>

            {/* Main Generator Component */}
            <Suspense fallback={<div className="h-96 animate-pulse bg-secondary/20 rounded-xl" />}>
              <StoryGenerator />
            </Suspense>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-y border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">Free</div>
                <div className="text-sm text-muted-foreground">No signup needed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">20 min</div>
                <div className="text-sm text-muted-foreground">Max story length</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Narrative styles</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">MIT</div>
                <div className="text-sm text-muted-foreground">Licensed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Public Stories - Discover Section */}
        {stories.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Popular Stories</h2>
                <p className="text-muted-foreground mt-1">Listen to what others have created</p>
              </div>
              <Button variant="outline" asChild className="bg-transparent">
                <Link href="/discover">View All</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story: any) => (
                <PublicStoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {/* How It Works - Simplified */}
        <section className="border-t border-border bg-secondary/10 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">1. Paste URL</h3>
                <p className="text-sm text-muted-foreground">Any public GitHub repository works</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">2. AI Analyzes</h3>
                <p className="text-sm text-muted-foreground">Claude reads and understands the code</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">3. Listen</h3>
                <p className="text-sm text-muted-foreground">ElevenLabs generates the audio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source CTA */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Open Source</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Built in public. Run it yourself.</h2>
            <p className="text-muted-foreground mb-8">
              Self-host with your own API keys for unlimited private generations. Or use this hosted version for free
              (stories are public).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View Source
                </a>
              </Button>
              <Button variant="outline" className="bg-transparent" asChild>
                <a href="https://github.com/codestory/codestory#self-hosting" target="_blank" rel="noopener noreferrer">
                  Self-Host Guide
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Headphones className="h-4 w-4" />
            <span>Code Story - MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/codestory/codestory"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
