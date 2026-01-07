import { GenerationPipeline } from "@/components/generation-pipeline"

export const metadata = {
  title: "Generate Tale | Code Tales",
  description: "Transform any GitHub repository into an engaging audio story",
}

export default function GeneratePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <GenerationPipeline />
      </div>
    </main>
  )
}
