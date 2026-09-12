const RATINGS = new Set([
  "helpful",
  "partly-helpful",
  "not-helpful",
  "concern",
]);
const MAX_DETAIL_CHARACTERS = 500;
const MAX_CONVERSATION_MESSAGES = 10;
const MAX_MESSAGE_CHARACTERS = 1500;
const MAX_RETENTION_DAYS = 30;

function setApiHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function cleanConversation(value) {
  if (!Array.isArray(value) || value.length > MAX_CONVERSATION_MESSAGES)
    return null;
  const cleaned = value.map((message) => {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_CHARACTERS
    ) {
      return null;
    }
    return { role: message.role, content: message.content.trim() };
  });
  return cleaned.every(Boolean) ? cleaned : null;
}

export default async function handler(req, res) {
  setApiHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });

  const { answerId, rating, detail, includeConversation, conversation } =
    req.body || {};
  if (
    typeof answerId !== "string" ||
    !/^ans_[A-Za-z0-9_-]{8,100}$/.test(answerId)
  ) {
    return res
      .status(400)
      .json({ error: "Feedback could not be matched to an answer." });
  }
  if (!RATINGS.has(rating)) {
    return res.status(400).json({ error: "Choose a valid feedback option." });
  }
  if (
    detail !== undefined &&
    (typeof detail !== "string" || detail.length > MAX_DETAIL_CHARACTERS)
  ) {
    return res.status(400).json({
      error: `Concern details must be ${MAX_DETAIL_CHARACTERS} characters or fewer.`,
    });
  }
  if (conversation !== undefined && includeConversation !== true) {
    return res.status(400).json({
      error:
        "Explicit consent is required before a conversation can be attached.",
    });
  }

  const recordedAt = new Date();
  const configuredRetention = Number.parseInt(
    process.env.FEEDBACK_RETENTION_DAYS || "",
    10,
  );
  const retentionDays =
    Number.isFinite(configuredRetention) && configuredRetention > 0
      ? Math.min(configuredRetention, MAX_RETENTION_DAYS)
      : MAX_RETENTION_DAYS;
  const deleteAfter = new Date(recordedAt);
  deleteAfter.setUTCDate(deleteAfter.getUTCDate() + retentionDays);

  const event = {
    answerId,
    rating,
    recordedAt: recordedAt.toISOString(),
    deleteAfter: deleteAfter.toISOString(),
  };
  if (rating === "concern" && detail?.trim()) event.detail = detail.trim();

  if (includeConversation === true) {
    const cleanedConversation = cleanConversation(conversation);
    if (!cleanedConversation) {
      return res
        .status(400)
        .json({ error: "The attached conversation is invalid or too long." });
    }
    event.conversationConsent = true;
    event.conversation = cleanedConversation;
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    return res
      .status(503)
      .json({ error: "Feedback recording is not available right now." });
  }

  try {
    const destination = new URL(redisUrl);
    if (destination.protocol !== "https:") throw new Error("HTTPS is required");
  } catch {
    console.error("Feedback recording is misconfigured");
    return res
      .status(503)
      .json({ error: "Feedback recording is not available right now." });
  }

  try {
    const storageKey = `feedback:${answerId}:${recordedAt.getTime()}:${crypto.randomUUID()}`;
    const expiresInSeconds = retentionDays * 24 * 60 * 60;
    const response = await fetch(redisUrl.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SET",
        storageKey,
        JSON.stringify(event),
        "EX",
        expiresInSeconds,
      ]),
    });
    const result = response.ok ? await response.json() : null;
    if (!response.ok || result?.error) {
      throw new Error("feedback store rejected event");
    }
    return res.status(202).json({ recorded: true });
  } catch {
    console.error("Feedback event could not be delivered");
    return res.status(502).json({
      error: "Feedback could not be recorded. Please try again later.",
    });
  }
}
