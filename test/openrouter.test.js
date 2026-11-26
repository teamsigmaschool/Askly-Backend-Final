import OpenAI from "openai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { failureFixtures, jsonResponse, providerResponse } from "./fixtures/provider.js"

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "test_key"
  process.env.OPENROUTER_MODEL = "openrouter/free"
  process.env.OPENROUTER_MAX_TOKENS = "500"
})

afterEach(() => {
  vi.resetModules()
})

describe("OpenRouter SDK client", () => {
  it("uses the OpenRouter base URL and server key", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse(providerResponse()))
    const { createOpenRouterClient } = await import("../src/lib/openrouter.js")
    const client = createOpenRouterClient({ apiKey: "test_key", maxRetries: 0, fetch: fetchSpy })

    await client.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Hello" }]
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0]
    expect(String(url)).toBe("https://openrouter.ai/api/v1/chat/completions")
    expect(new Headers(options.headers).get("authorization")).toBe("Bearer test_key")
  })

  it("retries a temporary failure within the SDK budget", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Busy" } }, 503))
      .mockResolvedValueOnce(jsonResponse(providerResponse()))
    const { createOpenRouterClient } = await import("../src/lib/openrouter.js")
    const client = createOpenRouterClient({ apiKey: "test_key", maxRetries: 2, fetch: fetchSpy })

    await client.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Hello" }]
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("stops waiting when the timeout is reached", async () => {
    const fetchSpy = vi.fn((_url, { signal }) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true })
        failureFixtures.slow().then(resolve, reject)
      })
    })
    const { createOpenRouterClient } = await import("../src/lib/openrouter.js")
    const client = createOpenRouterClient({
      apiKey: "test_key",
      timeout: 50,
      maxRetries: 0,
      fetch: fetchSpy
    })

    await expect(client.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Hello" }]
    })).rejects.toBeInstanceOf(OpenAI.APIConnectionTimeoutError)

    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it("does not retry an invalid key", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ error: { message: "Invalid key" } }, 401))
    const { createOpenRouterClient } = await import("../src/lib/openrouter.js")
    const client = createOpenRouterClient({ apiKey: "bad_key", maxRetries: 2, fetch: fetchSpy })

    await expect(client.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Hello" }]
    })).rejects.toBeInstanceOf(OpenAI.AuthenticationError)

    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it("stops after exhausting the retry budget", async () => {
    const fetchSpy = vi.fn(async () => failureFixtures.unavailable())

    const { createOpenRouterClient } = await import("../src/lib/openrouter.js")

    const client = createOpenRouterClient({
      apiKey: "test_key",
      fetch: fetchSpy
    })

    await expect(client.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Hello" }]
    })).rejects.toBeInstanceOf(OpenAI.InternalServerError)

    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
