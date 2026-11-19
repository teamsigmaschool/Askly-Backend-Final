import OpenAI from "openai"
import { env } from "../config/env.js"

export function createOpenRouterClient({
  apiKey = env.OPENROUTER_API_KEY,
  timeout = 15_000,
  maxRetries = 2,
  fetch
} = {}) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    timeout,
    maxRetries,
    ...(fetch ? { fetch } : {})
  })
}

export const openrouter = createOpenRouterClient()
