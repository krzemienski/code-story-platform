import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Headphones, Search, Flame, Clock, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PublicStoryCard } from "@/components/public-story-card"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DiscoverPage() {
  const supabase = await createClient()

  // Fetch trending stories (by play count)
  const { data: trendingStories } = await supabase
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
    .limit(50)

  // Fetch recent stories
  const { data: recentStories } = await supabase
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

  // Group by language for filtering
  const byLanguage = (trendingStories || []).reduce((acc: Record<string, any[]>, story: any) => {
    const lang = story.code_repositories?.primary_language || "Other"
    if (!acc[lang]) acc[lang] = []
    acc[lang].push(story)
    return acc
  }, {})

  const languages = Object.keys(byLanguage).sort()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Discover Stories</h1>
          <p className="text-zinc-400">Listen to code narratives created by the community</p>
        </div>

        {/* Search (UI placeholder) */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search repositories..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Tabs for Trending/Recent/By Language */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800 mb-8">
            <TabsTrigger value="trending" className="data-[state=active]:bg-zinc-800 gap-1.5">
              <Flame className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-zinc-800 gap-1.5">
              <Clock className="w-4 h-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="languages" className="data-[state=active]:bg-zinc-800 gap-1.5">
              <Code2 className="w-4 h-4" />
              By Language
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            {trendingStories && trendingStories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trendingStories.map((story: any) => (
                  <PublicStoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="recent">
            {recentStories && recentStories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentStories.map((story: any) => (
                  <PublicStoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="languages">
            {languages.length > 0 ? (
              <div className="space-y-12">
                {languages.map((language) => (
                  <section key={language}>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {language}
                      <span className="text-sm font-normal text-zinc-500">({byLanguage[language].length})</span>
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {byLanguage[language].map((story: any) => (
                        <PublicStoryCard key={story.id} story={story} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Headphones className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-white">No stories yet</h3>
      <p className="text-zinc-500 mb-6">Be the first to create a code story!</p>
      <Button asChild>
        <Link href="/">Create Story</Link>
      </Button>
    </div>
  )
}
