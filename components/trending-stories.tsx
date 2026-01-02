"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PublicStoryCard } from "@/components/public-story-card"
import { Flame, Clock, TrendingUp, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Story {
  id: string
  title: string
  narrative_style: string
  actual_duration_seconds: number | null
  play_count: number
  created_at: string
  code_repositories: {
    repo_owner: string
    repo_name: string
    primary_language: string | null
  } | null
}

export function TrendingStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("trending")
  const supabase = createClient()

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true)

      let query = supabase
        .from("stories")
        .select(`
          id,
          title,
          narrative_style,
          actual_duration_seconds,
          play_count,
          created_at,
          code_repositories (
            repo_owner,
            repo_name,
            primary_language
          )
        `)
        .eq("status", "completed")
        .eq("is_public", true)

      if (activeTab === "trending") {
        query = query.order("play_count", { ascending: false, nullsFirst: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data, error } = await query.limit(12)

      if (!error && data) {
        setStories(data as Story[])
      }
      setLoading(false)
    }

    fetchStories()
  }, [activeTab, supabase])

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Community Stories</h2>
              <p className="text-zinc-400">Discover audio narratives created by the community</p>
            </div>
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="trending" className="data-[state=active]:bg-zinc-700 gap-1.5">
                <Flame className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-zinc-700 gap-1.5">
                <Clock className="w-4 h-4" />
                Recent
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="trending" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">No stories yet</h3>
                <p className="text-zinc-500">Be the first to create a story!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <PublicStoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">No stories yet</h3>
                <p className="text-zinc-500">Be the first to create a story!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <PublicStoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
