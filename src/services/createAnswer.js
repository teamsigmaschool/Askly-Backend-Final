import { env } from "../config/env.js"
import { openrouter } from "../lib/openrouter.js"

export async function createAnswer(question, client = openrouter) {
  const response = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    messages: [
      { role: "system", content: "Answer clearly in no more than two sentences." },
      { role: "user", content: question }
    ],
    reasoning: {
      effort: "low",
      exclude: true
    },
    max_completion_tokens: env.OPENROUTER_MAX_TOKENS
  })

  const answer = response.choices?.[0]?.message?.content?.trim()
  if (!answer) {
    const error = new Error("The model returned an empty answer")
    error.code = "AI_EMPTY_RESPONSE"
    throw error
  }

  return {
    answer,
    usage: response.usage,
    requestId: response.id
  }
}
