function positiveInteger(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getPilotConfig() {
  const approvedResourceHosts = (
    process.env.APPROVED_RESOURCE_HOSTS ||
    "neurothinkhub.com,nhs.uk,gov.uk,samaritans.org"
  )
    .split(",")
    .map((host) =>
      host
        .trim()
        .toLowerCase()
        .replace(/^www\./, ""),
    )
    .filter(Boolean);

  return {
    pilotEnabled: process.env.PILOT_MODE_ENABLED === "true",
    maxQuestionCharacters: positiveInteger("MAX_QUESTION_CHARACTERS", 1500),
    maxResponseCharacters: positiveInteger("MAX_RESPONSE_CHARACTERS", 5000),
    maxResponseTokens: positiveInteger("MAX_RESPONSE_TOKENS", 400),
    maxSessionRequests: positiveInteger("MAX_SESSION_REQUESTS", 10),
    rateLimitRequests: positiveInteger("RATE_LIMIT_REQUESTS", 15),
    rateLimitWindowMs: positiveInteger("RATE_LIMIT_WINDOW_MS", 60 * 60 * 1000),
    providerTimeoutMs: positiveInteger("PROVIDER_TIMEOUT_MS", 20_000),
    approvedResourceHosts,
  };
}
