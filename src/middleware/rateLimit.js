const windows = new Map()

export function createUserRateLimit({ limit = 5, windowMs = 60_000 } = {}) {
  return function userRateLimit(request, response, next) {
    const key = request.user.id
    const now = Date.now()
    const record = windows.get(key)

    if (!record || now >= record.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (record.count >= limit) {
      return response.status(429).json({ error: "TOO_MANY_QUESTIONS", message: "You have sent too many questions. Try again shortly." })
    }

    record.count += 1
    next()
  }
}

export function resetRateLimits() {
  windows.clear()
}
