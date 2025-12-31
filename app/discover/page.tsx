import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Headphones, Github, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PublicStoryCard } from "@/components/public-story-card"

export default async function DiscoverPage() {
  const supabase = await createClient()

  const { data: stories } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(50)

  // Group by language
  const byLanguage = (stories || []).reduce((acc: Record<string, any[]>, story: any) => {
    const lang = story.code_repositories?.primary_language || "Other"
    if (!acc[lang]) acc[lang] = []
    acc[lang].push(story)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Headphones className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Code Story</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Create</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/codestory/codestory" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Stories</h1>
          <p className="text-muted-foreground">Listen to code narratives created by the community</p>
        </div>

        {/* Search (UI only for now) */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search repositories..." className="pl-10 bg-secondary/50" />
        </div>

        {/* Stories by language */}
        {Object.entries(byLanguage).map(([language, languageStories]) => (
          <section key={language} className="mb-12">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {language}
              <span className="text-sm font-normal text-muted-foreground">({languageStories.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {languageStories.map((story: any) => (
                <PublicStoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        ))}

        {(!stories || stories.length === 0) && (
          <div className="text-center py-16">
            <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a code story!</p>
            <Button asChild>
              <Link href="/">Create Story</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
