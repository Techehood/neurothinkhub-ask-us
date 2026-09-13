import { randomUUID } from "node:crypto";
import { getPilotConfig } from "./_lib/pilot-config.js";
import { buildSystemPrompt } from "./_lib/system-prompt.js";
import { checkRequestLimits } from "./_lib/rate-limit.js";

const MODEL = "claude-haiku-4-5-20251001";
const CONTEXT_VALUES = {
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

function getResponseTokenBudget(answerStyle, configuredMaximum) {
  const styleMaximum = {
    "quick-steps": 220,
    checklist: 250,
    examples: 300,
    "detailed-explanation": 500,
  }[answerStyle];
  return Math.min(configuredMaximum, styleMaximum || 250);
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
    return res.status(503).json({
      error:
        "The Ask NeuroThinkHub pilot is paused. Please use the support links on NeuroThinkHub.",
    });
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

  const limit = checkRequestLimits({
    ip: getClientIp(req),
    sessionId,
    rateLimitRequests: config.rateLimitRequests,
    rateLimitWindowMs: config.rateLimitWindowMs,
    maxSessionRequests: config.maxSessionRequests,
  });
  if (!limit.allowed) return res.status(429).json({ error: limit.message });

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
          context.answerStyle,
          config.maxResponseTokens,
        ),
        system: buildSystemPrompt(context, config.approvedResourceHosts),
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
    const reply = limitAndFilterReply(data.content?.[0]?.text, config);
    return res.status(200).json({ reply, answerId: `ans_${randomUUID()}` });
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
