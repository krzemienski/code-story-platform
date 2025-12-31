import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LandingAudioPlayer } from "@/components/landing-audio-player"
import { Code, Headphones, Zap, GitBranch, Brain, Clock, ArrowRight, Github, Server, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const FEATURES = [
  {
    icon: Brain,
    title: "Intent-Driven Generation",
    description: "Tell us what you want to learn, not just what repo to analyze. We tailor the story to your goals.",
  },
  {
    icon: Code,
    title: "Open Source",
    description: "Full codebase available. Self-host, customize, contribute. MIT licensed.",
  },
  {
    icon: Zap,
    title: "API First",
    description: "Integrate Code Story into your tools, CI/CD pipeline, or documentation workflow.",
  },
  {
    icon: GitBranch,
    title: "Claude Agents",
    description: "Multi-agent architecture with specialized skills for deep code analysis and storytelling.",
  },
  {
    icon: Headphones,
    title: "Multiple Styles",
    description: "Fiction, documentary, tutorial, podcast, or technical deep-dive. Your choice.",
  },
  {
    icon: Clock,
    title: "Flexible Length",
    description: "5 minute overview to 45+ minute exhaustive analysis. Match your available time.",
  },
]

const NARRATIVE_STYLES = [
  { id: "documentary", name: "Documentary", description: "Authoritative, factual narration" },
  { id: "tutorial", name: "Tutorial", description: "Step-by-step teaching style" },
  { id: "podcast", name: "Podcast", description: "Conversational, casual tone" },
  { id: "fiction", name: "Fiction", description: "Code as characters" },
  { id: "technical", name: "Technical", description: "Dense, expert-level detail" },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Open Source - MIT License
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Code to Story to <span className="text-primary">Understanding</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              The open-source platform that transforms code repositories into tailored audio narratives. Built for
              developers. Self-host or use our cloud.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href={user ? "/dashboard/new" : "/auth/sign-up"}>
                  Generate Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 bg-transparent">
                <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Demo Player Section - Using ElevenLabs UI Components */}
        <section className="border-y border-border bg-secondary/20 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold">Listen to a Sample</h2>
              <p className="mt-2 text-muted-foreground">FastAPI: Architecture Deep Dive - Documentary Style</p>
            </div>

            <LandingAudioPlayer />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Try different styles:</span>
              {NARRATIVE_STYLES.map((style) => (
                <button
                  key={style.id}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:border-primary hover:bg-secondary"
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold">Why Code Story?</h2>
              <p className="mt-4 text-muted-foreground">
                Purpose-built for developers who need deep, customizable control.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-secondary/50"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="border-y border-border bg-secondary/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="mt-4 text-muted-foreground">From repository to audio narrative in three steps.</p>
            </div>

            <div className="relative space-y-12">
              {/* Connection line */}
              <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-border lg:block" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  1
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Share Your Repository</h3>
                  <p className="text-muted-foreground">
                    Paste any public GitHub repository URL. We support all major programming languages and frameworks.
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  2
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Define Your Intent</h3>
                  <p className="text-muted-foreground">
                    Tell us what you want to learn. Architecture overview? Specific feature deep-dive? Onboarding guide?
                    We customize the narrative for your goals.
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  3
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Listen and Learn</h3>
                  <p className="text-muted-foreground">
                    Get a professional audio narrative with chapters, code references, and insights. Listen while
                    commuting, exercising, or during your break.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deployment Options Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold">Deploy Your Way</h2>
              <p className="mt-4 text-muted-foreground">Use our hosted service or self-host for complete control.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Hosted Platform</h3>
                <p className="mb-6 text-muted-foreground">
                  Start generating stories instantly. Free tier available with generous limits.
                </p>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> No setup required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> 5 stories/month free
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> All narrative styles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Priority support (Pro)
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href={user ? "/dashboard" : "/auth/sign-up"}>Get Started Free</Link>
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Server className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Self-Hosted</h3>
                <p className="mb-6 text-muted-foreground">
                  Deploy on your infrastructure. Full control over data and customization.
                </p>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Docker and Kubernetes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Private repositories
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Custom voice training
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Full source access
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/docs/self-hosting">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-secondary/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Ready to understand code differently?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Transform any repository into an audio narrative in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href={user ? "/dashboard/new" : "/auth/sign-up"}>
                  Start Your First Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
