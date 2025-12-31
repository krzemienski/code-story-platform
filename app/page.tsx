import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Github, Headphones, Code, Zap, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoryGenerator } from "@/components/story-generator"
import { Navbar } from "@/components/navbar"
import { TrendingStories } from "@/components/trending-stories"

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
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(6)

  return data || []
}

export default async function HomePage() {
  const stories = await getPublicStories()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main>
        {/* Hero + Generator Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-zinc-400">100% Open Source</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-white">
                Turn any codebase into an
                <span className="text-emerald-500 block sm:inline"> audio story</span>
              </h1>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto text-pretty">
                Paste a GitHub URL. Get a narrated explanation. Listen while commuting, exercising, or doing chores. No
                signup required.
              </p>
            </div>

            {/* Main Generator Component */}
            <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-900/50 rounded-xl" />}>
              <StoryGenerator />
            </Suspense>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/30">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-500">Free</div>
                <div className="text-sm text-zinc-500">No signup needed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">20 min</div>
                <div className="text-sm text-zinc-500">Max story length</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">5</div>
                <div className="text-sm text-zinc-500">Narrative styles</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">MIT</div>
                <div className="text-sm text-zinc-500">Licensed</div>
              </div>
            </div>
          </div>
        </section>

        <TrendingStories />

        {/* How It Works - Simplified */}
        <section className="border-t border-zinc-800 bg-zinc-900/20 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12 text-white">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-2 text-white">1. Paste URL</h3>
                <p className="text-sm text-zinc-500">Any public GitHub repository works</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-2 text-white">2. AI Analyzes</h3>
                <p className="text-sm text-zinc-500">Claude reads and understands the code</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Headphones className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-2 text-white">3. Listen</h3>
                <p className="text-sm text-zinc-500">ElevenLabs generates the audio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source CTA */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-zinc-300">Open Source</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Built in public. Run it yourself.</h2>
            <p className="text-zinc-400 mb-8">
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
              <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800" asChild>
                <a href="https://github.com/codestory/codestory#self-hosting" target="_blank" rel="noopener noreferrer">
                  Self-Host Guide
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Headphones className="h-4 w-4" />
            <span>Code Story - MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/codestory/codestory"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <Link href="/discover" className="text-zinc-500 hover:text-white transition-colors">
              Discover
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
