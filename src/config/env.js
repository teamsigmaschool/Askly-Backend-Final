const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim()
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim()
const OPENROUTER_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS)

if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required")
if (!OPENROUTER_MODEL) throw new Error("OPENROUTER_MODEL is required")
if (!Number.isInteger(OPENROUTER_MAX_TOKENS) || OPENROUTER_MAX_TOKENS < 1 || OPENROUTER_MAX_TOKENS > 500) {
  throw new Error("OPENROUTER_MAX_TOKENS must be an integer from 1 to 500")
}

export const env = {
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  OPENROUTER_MAX_TOKENS
}
