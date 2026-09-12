const ipWindows = new Map();
const sessionWindows = new Map();

function consume(store, key, limit, windowMs, now) {
  const current = store.get(key);
  if (!current || now - current.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function checkRequestLimits({
  ip,
  sessionId,
  rateLimitRequests,
  rateLimitWindowMs,
  maxSessionRequests,
}) {
  const now = Date.now();
  if (!consume(ipWindows, ip, rateLimitRequests, rateLimitWindowMs, now)) {
    return {
      allowed: false,
      message:
        "Too many requests from this connection. Please wait and try again later.",
    };
  }

  if (
    !consume(
      sessionWindows,
      sessionId,
      maxSessionRequests,
      rateLimitWindowMs,
      now,
    )
  ) {
    return {
      allowed: false,
      message:
        "You have reached the pilot session limit. You can return after the limit resets.",
    };
  }

  return { allowed: true };
}
