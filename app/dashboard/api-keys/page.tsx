import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Key, Copy, Trash2, ExternalLink } from "lucide-react"

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // For now, show placeholder since we don't have API keys table populated
  const apiKeys: { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }[] =
    []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Key
        </Button>
      </div>

      {/* API Keys List */}
      {apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="border-border bg-card">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Key className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="font-mono text-sm text-muted-foreground">{key.key_prefix}•••••••••</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No API Keys</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Create an API key to access Code Story programmatically.
            </p>
            <Button className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card className="mt-8 border-border bg-card">
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Learn how to use the Code Story API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-secondary p-4">
            <pre className="overflow-x-auto text-sm">
              <code>{`# Generate a story
curl -X POST https://api.codestory.dev/v1/stories \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/fastapi/fastapi",
    "style": "documentary",
    "length": "standard"
  }'`}</code>
            </pre>
          </div>
          <Button variant="link" asChild className="mt-4 px-0">
            <Link href="/docs/api">
              View Full Documentation
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
