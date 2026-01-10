import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Circle, ArrowRight, Database, Cpu, Volume2, Cloud, FileText } from "lucide-react"

const variations = [
  {
    id: 1,
    style: "Documentary",
    title: "Ralph Wiggum: A Springfield Documentary",
    voice: "Antoni",
    model: "eleven_multilingual_v2",
    format: "mp3_44100_128",
    aiModel: "claude-sonnet-4",
    color: "bg-blue-500",
    stability: 0.5,
    similarity: 0.75,
  },
  {
    id: 2,
    style: "Fiction",
    title: "Ralph Wiggum and the Mystery of the Missing Crayons",
    voice: "Bella",
    model: "eleven_v3",
    format: "mp3_44100_192",
    aiModel: "claude-sonnet-4",
    color: "bg-purple-500",
    stability: 0.4,
    similarity: 0.8,
  },
  {
    id: 3,
    style: "Tutorial",
    title: "Learning Life Lessons with Ralph Wiggum",
    voice: "Adam",
    model: "eleven_flash_v2_5",
    format: "mp3_22050_32",
    aiModel: "gpt-4o",
    color: "bg-green-500",
    stability: 0.7,
    similarity: 0.6,
  },
  {
    id: 4,
    style: "Podcast",
    title: "The Ralph Wiggum Podcast",
    voice: "Rachel",
    model: "eleven_turbo_v2_5",
    format: "mp3_44100_64",
    aiModel: "claude-sonnet-4",
    color: "bg-orange-500",
    stability: 0.45,
    similarity: 0.7,
  },
  {
    id: 5,
    style: "Audiobook",
    title: "The Complete Ralph Wiggum Chronicles: Premium Edition",
    voice: "Antoni",
    model: "Studio API",
    format: "pcm_44100 (lossless)",
    aiModel: "claude-4-opus",
    color: "bg-pink-500",
    stability: 0.5,
    similarity: 0.75,
    isStudio: true,
  },
]

const pipelineSteps = [
  { icon: FileText, label: "Initialize", description: "Load story from database" },
  { icon: Database, label: "Analyze", description: "Parse repository structure" },
  { icon: Cpu, label: "Generate Script", description: "AI creates narrative" },
  { icon: Volume2, label: "Create Audio", description: "ElevenLabs TTS" },
  { icon: Cloud, label: "Upload", description: "Store in Supabase" },
  { icon: CheckCircle, label: "Complete", description: "Ready for playback" },
]

export default function RalphDocsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Ralph Wiggum Project</h1>
          <p className="text-xl text-muted-foreground">Visual Documentation - 5 ElevenLabs API Configurations</p>
        </div>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Pipeline</CardTitle>
            <CardDescription>Step-by-step flow from story creation to audio playback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between overflow-x-auto pb-4">
              {pipelineSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 px-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{step.label}</p>
                        <p className="text-xs text-muted-foreground max-w-24">{step.description}</p>
                      </div>
                    </div>
                    {index < pipelineSteps.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Variations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {variations.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className={`h-2 ${v.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Variation {v.id}</Badge>
                  {v.isStudio && <Badge variant="secondary">Studio API</Badge>}
                </div>
                <CardTitle className="text-lg">{v.style}</CardTitle>
                <CardDescription className="line-clamp-2">{v.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Voice</p>
                    <p className="font-medium">{v.voice}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">AI Model</p>
                    <p className="font-medium">{v.aiModel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">TTS Model</p>
                    <p className="font-medium text-xs">{v.model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Format</p>
                    <p className="font-medium text-xs">{v.format}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Voice Settings</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Stability:</span>
                      <span className="text-xs font-mono">{v.stability}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Similarity:</span>
                      <span className="text-xs font-mono">{v.similarity}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>ElevenLabs Configuration Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of all 5 variations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variation</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Voice</TableHead>
                  <TableHead>TTS Model</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>AI Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${v.color}`} />
                        <span>#{v.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{v.style}</TableCell>
                    <TableCell>{v.voice}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{v.model}</code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{v.format}</code>
                    </TableCell>
                    <TableCell>{v.aiModel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Database Schema Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>Entity relationship diagram</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">code_repositories</span>
                </div>
                <div className="space-y-1 text-xs font-mono text-muted-foreground">
                  <p>id: uuid (PK)</p>
                  <p>repo_url: text</p>
                  <p>repo_name: text</p>
                  <p>repo_owner: text</p>
                  <p>description: text</p>
                  <p>primary_language: text</p>
                </div>
              </div>
              <div className="rounded-lg border p-4 border-primary">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="font-semibold">stories</span>
                </div>
                <div className="space-y-1 text-xs font-mono text-muted-foreground">
                  <p>id: uuid (PK)</p>
                  <p>repository_id: uuid (FK)</p>
                  <p>title: text</p>
                  <p>script_text: text</p>
                  <p>audio_url: text</p>
                  <p>status: text</p>
                  <p>generation_mode: text</p>
                  <p>generation_config: jsonb</p>
                  <p>model_config: jsonb</p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">processing_logs</span>
                </div>
                <div className="space-y-1 text-xs font-mono text-muted-foreground">
                  <p>id: uuid (PK)</p>
                  <p>story_id: uuid (FK)</p>
                  <p>agent_name: text</p>
                  <p>action: text</p>
                  <p>level: text</p>
                  <p>details: jsonb</p>
                  <p>timestamp: timestamptz</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ElevenLabs API Reference */}
        <Card>
          <CardHeader>
            <CardTitle>ElevenLabs API Endpoints</CardTitle>
            <CardDescription>APIs used in this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>POST</Badge>
                <code className="text-sm">/v1/text-to-speech/{"{voice_id}"}</code>
              </div>
              <p className="text-sm text-muted-foreground">Direct TTS API - Used by variations 1-4 (hybrid mode)</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">POST</Badge>
                <code className="text-sm">/v1/studio/projects</code>
              </div>
              <p className="text-sm text-muted-foreground">Create Studio project - Used by variation 5 (studio mode)</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">POST</Badge>
                <code className="text-sm">/v1/studio/projects/{"{project_id}"}/convert</code>
              </div>
              <p className="text-sm text-muted-foreground">Start audio conversion for Studio project</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-sm">
                  /v1/studio/projects/{"{project_id}"}/snapshots/{"{snapshot_id}"}/stream
                </code>
              </div>
              <p className="text-sm text-muted-foreground">Download converted audio from Studio</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "Repository created in database", done: true },
                { label: "5 story variations created", done: true },
                { label: "Processing logs initialized", done: true },
                { label: "ElevenLabs API integration", done: true },
                { label: "Generation pipeline implemented", done: true },
                { label: "Real-time subscriptions configured", done: true },
                { label: "Test dashboard created", done: true },
                { label: "Documentation complete", done: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
