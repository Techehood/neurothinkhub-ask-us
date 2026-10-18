// Minimal Upstash REST client shared by the API routes.
export function getRedisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    if (new URL(url).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url: url.replace(/\/$/, ""), token };
}

// Runs several commands in one round trip and returns their results in order.
export async function redisPipeline(redis, commands) {
  const response = await fetch(`${redis.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redis.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  const results = response.ok ? await response.json() : null;
  if (!Array.isArray(results) || results.some((entry) => entry?.error)) {
    throw new Error("redis pipeline failed");
  }
  return results.map((entry) => entry.result);
}
