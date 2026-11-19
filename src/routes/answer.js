import { Router } from "express"
import OpenAI from "openai"
import { createAnswer } from "../services/createAnswer.js"

export const answerRouter = Router()

answerRouter.post("/", async (request, response) => {
  const question = request.body?.question

  if (typeof question !== "string" || !question.trim()) {
    return response.status(400).json({ code: "INVALID_QUESTION", message: "Enter a question first" })
  }

  if (question.trim().length > 500) {
    return response.status(400).json({ code: "QUESTION_TOO_LONG", message: "Keep the question within 500 characters" })
  }

  try {
    const result = await createAnswer(question.trim())

    console.info("OpenRouter request complete", {
      requestId: result.requestId,
      inputTokens: result.usage?.prompt_tokens,
      outputTokens: result.usage?.completion_tokens,
      totalTokens: result.usage?.total_tokens
    })

    return response.status(200).json({ answer: result.answer })
  } catch (error) {
    console.error("Askly provider failure", {
      name: error.name,
      status: error.status,
      requestId: error.request_id
    })

    if (error instanceof OpenAI.AuthenticationError) {
      return response.status(500).json({ code: "AI_CONFIGURATION", message: "Askly is unavailable right now" })
    }

    if (error instanceof OpenAI.RateLimitError || error.status === 429) {
      return response.status(503).json({ code: "AI_BUSY", message: "Askly is busy. Please try again shortly" })
    }

    if (error instanceof OpenAI.APIConnectionTimeoutError || error.name === "APIConnectionTimeoutError") {
      return response.status(504).json({ code: "AI_TIMEOUT", message: "Askly took too long to reply" })
    }

    if (error instanceof OpenAI.InternalServerError) {
      return response.status(503).json({ code: "AI_UNAVAILABLE", message: "Askly could not answer right now" })
    }

    return response.status(502).json({ code: "AI_UNAVAILABLE", message: "Askly could not answer right now" })
  }
})
