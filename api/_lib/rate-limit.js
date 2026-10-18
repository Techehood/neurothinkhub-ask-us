import { createHash } from "node:crypto";
import { getRedisConfig, redisPipeline } from "./redis.js";

const ipWindows = new Map();
const sessionWindows = new Map();
const dailyCounts = new Map();

const MESSAGES = {
  ip: "Too many requests from this connection. Please wait and try again later.",
  session:
    "You have reached the pilot session limit. You can return after the limit resets.",
};

// Short one-way hash so raw IPs and session IDs are never stored or logged.
export function anonymise(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

// The daily ceiling resets at midnight UTC.
function utcDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}

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

// Per-instance fallback, used when Redis is not configured or unreachable.
function checkInMemory(limits, now) {
  if (
    !consume(
      ipWindows,
      limits.ip,
      limits.rateLimitRequests,
      limits.rateLimitWindowMs,
      now,
    )
  ) {
    return { allowed: false, reason: "ip", message: MESSAGES.ip };
  }
  if (
    !consume(
      sessionWindows,
      limits.sessionId,
      limits.maxSessionRequests,
      limits.rateLimitWindowMs,
      now,
    )
  ) {
    return { allowed: false, reason: "session", message: MESSAGES.session };
  }
  const day = utcDay(now);
  const used = (dailyCounts.get(day) || 0) + 1;
  dailyCounts.clear();
  dailyCounts.set(day, used);
  if (used > limits.dailyRequestCeiling) {
    return { allowed: false, reason: "daily" };
  }
  return { allowed: true };
}

async function checkInRedis(redis, limits, now) {
  const window = Math.floor(now / limits.rateLimitWindowMs);
  const windowSeconds = Math.ceil(limits.rateLimitWindowMs / 1000);
  const ipKey = `rl:ip:${anonymise(limits.ip)}:${window}`;
  const sessionKey = `rl:session:${anonymise(limits.sessionId)}:${window}`;

  const [ipCount, , sessionCount] = await redisPipeline(redis, [
    ["INCR", ipKey],
    ["EXPIRE", ipKey, windowSeconds],
    ["INCR", sessionKey],
    ["EXPIRE", sessionKey, windowSeconds],
  ]);
  if (ipCount > limits.rateLimitRequests) {
    return { allowed: false, reason: "ip", message: MESSAGES.ip };
  }
  if (sessionCount > limits.maxSessionRequests) {
    return { allowed: false, reason: "session", message: MESSAGES.session };
  }

  // Counted only after the per-visitor limits pass, so one noisy connection
  // cannot use up the shared daily ceiling.
  const dailyKey = `rl:daily:${utcDay(now)}`;
  const [dailyCount] = await redisPipeline(redis, [
    ["INCR", dailyKey],
    ["EXPIRE", dailyKey, 2 * 24 * 60 * 60],
  ]);
  if (dailyCount > limits.dailyRequestCeiling) {
    return { allowed: false, reason: "daily" };
  }
  return { allowed: true };
}

export async function checkRequestLimits(limits) {
  const now = Date.now();
  const redis = getRedisConfig();
  if (redis) {
    try {
      return await checkInRedis(redis, limits, now);
    } catch {
      console.error("Shared rate limits unavailable; using instance limits");
    }
  }
  return checkInMemory(limits, now);
}
