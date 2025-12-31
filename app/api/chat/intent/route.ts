// Intent Agent API - Conversational story customization

import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { INTENT_AGENT_PROMPT } from "@/lib/agents/prompts"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, repoName, repoOwner } = await req.json()

  const systemPrompt = `${INTENT_AGENT_PROMPT}

CURRENT CONTEXT:
Repository: ${repoOwner}/${repoName}

Guide the user to define their learning goals for this repository. Be helpful and concise.`

  const modelMessages = convertToModelMessages(messages as UIMessage[])

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: systemPrompt,
    messages: modelMessages,
    maxTokens: 500,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
