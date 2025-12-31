"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Github, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PopularRepo } from "@/lib/types"

interface RepoInputProps {
  onSubmit: (repoUrl: string) => void
  isLoading?: boolean
  error?: string | null
  className?: string
}

const POPULAR_REPOS: PopularRepo[] = [
  { owner: "fastapi", name: "fastapi", stars: "68k", language: "Python", url: "https://github.com/fastapi/fastapi" },
  {
    owner: "langchain-ai",
    name: "langchain",
    stars: "75k",
    language: "Python",
    url: "https://github.com/langchain-ai/langchain",
  },
  { owner: "vercel", name: "next.js", stars: "118k", language: "TypeScript", url: "https://github.com/vercel/next.js" },
  { owner: "shadcn-ui", name: "ui", stars: "52k", language: "TypeScript", url: "https://github.com/shadcn-ui/ui" },
]

export function RepoInput({ onSubmit, isLoading, error, className }: RepoInputProps) {
  const [url, setUrl] = useState("")
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateGitHubUrl = (input: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    return pattern.test(input) || /^[\w-]+\/[\w.-]+$/.test(input)
  }

  const handleChange = (value: string) => {
    setUrl(value)
    if (value.length > 0) {
      setIsValid(validateGitHubUrl(value))
    } else {
      setIsValid(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid && url) {
      const fullUrl = url.startsWith("http") ? url : `https://github.com/${url}`
      onSubmit(fullUrl)
    }
  }

  const handlePopularRepo = (repo: PopularRepo) => {
    setUrl(repo.url)
    setIsValid(true)
    onSubmit(repo.url)
  }

  return (
    <div className={cn("space-y-6", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Github className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              "h-14 pl-12 pr-32 text-base",
              isValid === true && "border-primary",
              isValid === false && "border-destructive",
            )}
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {isValid === true && !isLoading && <CheckCircle className="h-5 w-5 text-primary" />}
            {isValid === false && <AlertCircle className="h-5 w-5 text-destructive" />}
            <Button type="submit" disabled={!isValid || isLoading} className="h-10">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </form>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Popular repositories to try:</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POPULAR_REPOS.map((repo) => (
            <button
              key={`${repo.owner}/${repo.name}`}
              onClick={() => handlePopularRepo(repo)}
              disabled={isLoading}
              className="group rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="text-sm font-medium group-hover:text-primary">
                {repo.owner}/{repo.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {repo.stars} stars · {repo.language}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
