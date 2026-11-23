import request from "supertest"
import { describe, expect, it } from "vitest"

describe("health route", () => {
  it("reports that the server is ready", async () => {
    process.env.OPENROUTER_API_KEY = "test_key"
    process.env.OPENROUTER_MODEL = "openrouter/free"
    process.env.OPENROUTER_MAX_TOKENS = "180"
    const { app } = await import("../src/app.js")
    const response = await request(app).get("/api/health")
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: "ok" })
  })
})
