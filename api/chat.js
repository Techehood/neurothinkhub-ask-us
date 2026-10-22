import { randomUUID } from "node:crypto";
import { getPilotConfig } from "./_lib/pilot-config.js";
import { buildSystemPrompt } from "./_lib/system-prompt.js";
import { anonymise, checkRequestLimits } from "./_lib/rate-limit.js";
import { resolvePattern } from "../src/config/patterns.js";
import { resolveTopic } from "../src/config/topics.js";

const MODEL = "claude-haiku-4-5-20251001";
const PAUSED_MESSAGE =
  "The Ask NeuroThinkHub pilot is paused. Please use the support links on NeuroThinkHub.";
const CONTEXT_VALUES = {
  // persona is a first-class routing field — do not strip
  persona: [
    "neurodivergent",
    "manager",
    "hr-ld",
    "parent-family",
    "educator",
    "entrepreneur",
    "ally-professional",
  ],
  supportFor: ["myself", "learner", "employee", "family-member", "team"],
  setting: ["education", "workplace", "home", "wellbeing", "entrepreneurship"],
  answerStyle: ["quick-steps", "checklist", "examples", "detailed-explanation"],
};

function cleanContext(value) {
  const context = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(CONTEXT_VALUES).flatMap(([key, allowed]) =>
      allowed.includes(context[key]) ? [[key, context[key]]] : [],
    ),
  );
}

function cleanHistory(value, maximumCharacters) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim(),
    )
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, maximumCharacters),
    }));
}

function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0];
  return first?.trim() || req.socket?.remoteAddress || "unknown";
}

function hostIsApproved(hostname, approvedHosts) {
  const normalised = hostname.toLowerCase().replace(/^www\./, "");
  return approvedHosts.some(
    (host) => normalised === host || normalised.endsWith(`.${host}`),
  );
}

function limitAndFilterReply(text, config) {
  const safeText = String(
    text || "Sorry, I could not generate a response.",
  ).replace(/https?:\/\/[^\s)\]}>,]+/gi, (url) => {
    try {
      return hostIsApproved(new URL(url).hostname, config.approvedResourceHosts)
        ? url
        : "[link removed: not on the approved resource list]";
    } catch {
      return "[link removed: invalid link]";
    }
  });

  if (safeText.length <= config.maxResponseCharacters) return safeText;
  return (
    safeText.slice(0, Math.max(0, config.maxResponseCharacters - 1)).trimEnd() +
    "…"
  );
}

// Patterns of need set their own budget, still capped by MAX_RESPONSE_TOKENS.
const PATTERN_RESPONSE_TOKENS = {
  sensory: 200,
  masking: 500,
  scaffolder: 600,
  translator: 1400,
};

// Audiences whose required framing needs more room than a blank-chat answer.
const PERSONA_RESPONSE_TOKENS = {
  "hr-ld": 500,
};

// Headroom above the 150-word guidance so answers are not cut mid-sentence.
const DEFAULT_RESPONSE_TOKENS = 400;

function getResponseTokenBudget(context, configuredMaximum, patternKey) {
  const patternMaximum = PATTERN_RESPONSE_TOKENS[patternKey];
  if (patternMaximum) return Math.min(configuredMaximum, patternMaximum);

  const personaMaximum = PERSONA_RESPONSE_TOKENS[context.persona];
  if (personaMaximum) return Math.min(configuredMaximum, personaMaximum);

  const styleMaximum = {
    "quick-steps": 220,
    checklist: 250,
    examples: 300,
    "detailed-explanation": 500,
  }[context.answerStyle];
  return Math.min(configuredMaximum, styleMaximum || DEFAULT_RESPONSE_TOKENS);
}

function setApiHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

export default async function handler(req, res) {
  setApiHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });

  const config = getPilotConfig();
  if (!config.pilotEnabled) {
    return res.status(503).json({ error: PAUSED_MESSAGE });
  }

  const question =
    typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question)
    return res.status(400).json({ error: "Please enter a question." });
  if (question.length > config.maxQuestionCharacters) {
    return res.status(400).json({
      error: `Your question is too long. Please shorten it to ${config.maxQuestionCharacters} characters or fewer.`,
    });
  }

  const sessionId =
    typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(sessionId)) {
    return res
      .status(400)
      .json({ error: "Please refresh the page and try again." });
  }

  const limit = await checkRequestLimits({
    ip: getClientIp(req),
    sessionId,
    rateLimitRequests: config.rateLimitRequests,
    rateLimitWindowMs: config.rateLimitWindowMs,
    maxSessionRequests: config.maxSessionRequests,
    dailyRequestCeiling: config.dailyRequestCeiling,
  });
  if (!limit.allowed) {
    console.log(
      JSON.stringify({ event: "chat_limited", reason: limit.reason }),
    );
    if (limit.reason === "daily")
      return res.status(503).json({ error: PAUSED_MESSAGE });
    return res.status(429).json({ error: limit.message });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Anthropic request blocked: server credential is not configured",
    );
    return res.status(503).json({
      error:
        "Ask NeuroThinkHub is temporarily unavailable. Please try again shortly.",
    });
  }

  const context = cleanContext(req.body?.context);
  // Only the key crosses the trust boundary; guardrail text comes from config.
  const pattern = resolvePattern(req.body?.patternKey);
  // Same rule for topics: a key from the allowlist, never client text.
  const topic = resolveTopic(req.body?.topicKey);
  const history = cleanHistory(req.body?.history, config.maxQuestionCharacters);
  const messages = [...history, { role: "user", content: question }];
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.providerTimeoutMs,
  );

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: getResponseTokenBudget(
          context,
          config.maxResponseTokens,
          pattern?.key,
        ),
        system: buildSystemPrompt(
          context,
          config.approvedResourceHosts,
          pattern,
          topic,
        ),
        messages,
      }),
    });

    if (!response.ok) {
      console.error("Anthropic request failed", { status: response.status });
      return res.status(502).json({
        error:
          "Ask NeuroThinkHub is temporarily unavailable. Please try again shortly.",
      });
    }

    const data = await response.json();
    // Usage only: never log question, history or reply text.
    console.log(
      JSON.stringify({
        event: "chat_usage",
        pattern: pattern?.key ?? null,
        session: anonymise(sessionId),
        inputTokens: data.usage?.input_tokens ?? null,
        outputTokens: data.usage?.output_tokens ?? null,
        stopReason: data.stop_reason ?? null,
      }),
    );
    const reply = limitAndFilterReply(data.content?.[0]?.text, config);
    return res.status(200).json({
      reply,
      answerId: `ans_${randomUUID()}`,
      activePatternKey: pattern?.key ?? null,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({
        error:
          "The answer took too long. Please try again with a shorter question.",
      });
    }

    console.error("Anthropic request could not be completed");
    return res.status(502).json({
      error:
        "Ask NeuroThinkHub is temporarily unavailable. Please try again shortly.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
