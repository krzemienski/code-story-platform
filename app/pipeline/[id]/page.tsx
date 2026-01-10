import { Suspense } from "react"
import { PipelineDashboard } from "@/components/pipeline-dashboard"
import { Loader2 } from "lucide-react"

interface PipelinePageProps {
  params: Promise<{ id: string }>
}

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id } = await params

  return (
    <div className="container max-w-7xl py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <PipelineDashboard storyId={id} />
      </Suspense>
    </div>
  )
}
