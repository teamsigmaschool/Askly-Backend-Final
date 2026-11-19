import cors from "cors"
import express from "express"
import { requireAiAccess, requireUser } from "./middleware/auth.js"
import { createUserRateLimit } from "./middleware/rateLimit.js"
import { answerRouter } from "./routes/answer.js"

export const app = express()

app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json({ limit: "8kb" }))

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" })
})

app.use(
  "/api/answer",
  requireUser,
  requireAiAccess,
  createUserRateLimit({ limit: 5, windowMs: 60_000 }),
  answerRouter
)
