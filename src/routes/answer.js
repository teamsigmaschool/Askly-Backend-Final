import { Router } from "express"
import OpenAI from "openai"
import { createAnswer } from "../services/createAnswer.js"

export const answerRouter = Router()
const QUESTION_LIMIT = 500

function readQuestion(body) {
  const question = body?.question

  if (typeof question !== "string" || question.trim() === "") {
    return { error: "QUESTION_REQUIRED" }
  }

  if (question.length > QUESTION_LIMIT) {
    return { error: "QUESTION_TOO_LONG" }
  }

  return { question: question.trim() }
}

answerRouter.post("/", async (request, response) => {
  const questionResult = readQuestion(request.body)

  if (questionResult.error) {
    const message = questionResult.error === "QUESTION_TOO_LONG"
      ? "Keep the question within 500 characters"
      : "Enter a question first"

    return response.status(400).json({ error: questionResult.error, message })
  }

  try {
    const answerResult = await createAnswer(questionResult.question)

    console.info("OpenRouter request complete", {
      requestId: answerResult.requestId,
      inputTokens: answerResult.usage?.prompt_tokens,
      outputTokens: answerResult.usage?.completion_tokens,
      totalTokens: answerResult.usage?.total_tokens
    })

    return response.status(200).json({ answer: answerResult.answer })
  } catch (error) {
    console.error("Askly provider failure", {
      name: error.name,
      status: error.status,
      requestId: error.request_id
    })

    if (error instanceof OpenAI.AuthenticationError) {
      return response.status(500).json({ error: "AI_CONFIGURATION", message: "Askly is unavailable right now" })
    }

    if (error instanceof OpenAI.RateLimitError || error.status === 429) {
      return response.status(503).json({ error: "AI_BUSY", message: "Askly is busy. Please try again shortly" })
    }

    if (error instanceof OpenAI.APIConnectionTimeoutError || error.name === "APIConnectionTimeoutError") {
      return response.status(504).json({ error: "AI_TIMEOUT", message: "Askly took too long to reply" })
    }

    if (error instanceof OpenAI.InternalServerError) {
      return response.status(503).json({ error: "AI_UNAVAILABLE", message: "Askly could not answer right now" })
    }

    return response.status(503).json({ error: "AI_UNAVAILABLE", message: "Askly could not answer right now" })
  }
})
