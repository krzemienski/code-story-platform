import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code2, Mic2, Sparkles, Github, Zap, HelpCircle, ExternalLink, Terminal, Wand2 } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Documentation
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">How Code Story Works</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform any GitHub repository into an engaging audio narrative. Perfect for learning codebases,
            onboarding, or just enjoying code as a story.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              Quick Start
            </CardTitle>
            <CardDescription>Get your first audio story in under 2 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-medium text-foreground">Paste a GitHub URL</p>
                  <p className="text-sm text-muted-foreground">
                    Any public repository works. Private repos require authentication.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-medium text-foreground">Choose your style</p>
                  <p className="text-sm text-muted-foreground">
                    Pick from fiction, documentary, tutorial, podcast, or technical narration.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  3
                </span>
                <div>
                  <p className="font-medium text-foreground">Generate & Listen</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes the code and creates an audio story. Download or stream instantly.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code2 className="h-5 w-5 text-blue-500" />
                Smart Code Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Our AI deeply analyzes repository structure, README files, code patterns, dependencies, and architecture
              to understand what the project does and how it works.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Multiple Narrative Styles
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Choose how your story is told: dramatic fiction, educational documentary, step-by-step tutorial,
              conversational podcast, or precise technical analysis.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mic2 className="h-5 w-5 text-rose-500" />
                Natural Voice Synthesis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Powered by ElevenLabs, our text-to-speech creates natural, expressive audio with multiple voice options
              optimized for different content types.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Flexible Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Generate stories from 3 minutes to 60 minutes. Longer durations provide more detail about architecture,
              design decisions, and implementation.
            </CardContent>
          </Card>
        </div>

        {/* Narrative Styles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Narrative Styles Explained</CardTitle>
            <CardDescription>Choose the style that fits your learning preference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                <Badge variant="outline" className="shrink-0">
                  Fiction
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Dramatic Storytelling</p>
                  <p className="text-sm text-muted-foreground">
                    The code becomes a character in an epic tale. Functions are heroes, bugs are villains, and
                    architecture decisions drive the plot. Great for entertainment and memorable learning.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                <Badge variant="outline" className="shrink-0">
                  Documentary
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Educational Exploration</p>
                  <p className="text-sm text-muted-foreground">
                    Like a nature documentary for code. Explains the "why" behind decisions, explores the ecosystem, and
                    provides historical context. Perfect for deep understanding.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                <Badge variant="outline" className="shrink-0">
                  Tutorial
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Step-by-Step Guide</p>
                  <p className="text-sm text-muted-foreground">
                    Practical walkthrough of how to use the codebase. Covers setup, key files, common patterns, and best
                    practices. Ideal for onboarding and getting started.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                <Badge variant="outline" className="shrink-0">
                  Podcast
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Conversational Discussion</p>
                  <p className="text-sm text-muted-foreground">
                    Casual, engaging discussion about the project. Covers interesting features, potential improvements,
                    and opinions. Great for commutes and background listening.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                <Badge variant="outline" className="shrink-0">
                  Technical
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Precise Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Detailed technical breakdown of architecture, patterns, and implementation. Covers dependencies,
                    APIs, and code structure. Best for experienced developers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Hosting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Self-Hosting
            </CardTitle>
            <CardDescription>Run Code Story on your own infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Code Story is open source. You can self-host it with your own API keys for Claude (Anthropic) and
              ElevenLabs.
            </p>
            <div className="rounded-lg bg-zinc-900 p-4 font-mono text-sm text-zinc-300">
              <p className="text-zinc-500"># Clone the repository</p>
              <p>git clone https://github.com/codestory/codestory</p>
              <p className="mt-2 text-zinc-500"># Install dependencies</p>
              <p>pnpm install</p>
              <p className="mt-2 text-zinc-500"># Set up environment variables</p>
              <p>cp .env.example .env.local</p>
              <p className="mt-2 text-zinc-500"># Run locally</p>
              <p>pnpm dev</p>
            </div>
            <Button variant="outline" asChild>
              <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-medium text-foreground">How long does generation take?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Typically 2-5 minutes depending on repository size and chosen duration. Larger repos and longer
                durations take more time.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">What repositories work best?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Repos with good README files, clear structure, and meaningful code comments produce the best stories.
                Any public GitHub repo works.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Can I use private repositories?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Yes! Sign in with GitHub to access your private repositories. Your code is analyzed but never stored.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">What about costs?</p>
              <p className="text-sm text-muted-foreground mt-1">
                The hosted version is free while in beta. Self-hosting requires your own API keys (Claude ~$0.01-0.05
                per story, ElevenLabs ~$0.30-1.00 per story).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/">
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your First Story
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
