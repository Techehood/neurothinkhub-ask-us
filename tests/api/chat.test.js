// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

function request(body, overrides = {}) {
  return {
    method: "POST",
    body,
    headers: { "x-forwarded-for": "203.0.113.10", ...overrides.headers },
    socket: { remoteAddress: "203.0.113.10" },
    ...overrides,
  };
}

async function loadHandler() {
  vi.resetModules();
  return (await import("../../api/chat.js")).default;
}

async function call(handler, body, overrides) {
  const res = responseRecorder();
  await handler(request(body, overrides), res);
  return res;
}

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    ANTHROPIC_API_KEY: "server-test-key",
    PILOT_MODE_ENABLED: "true",
    MAX_QUESTION_CHARACTERS: "120",
    MAX_RESPONSE_CHARACTERS: "500",
    MAX_RESPONSE_TOKENS: "400",
    MAX_SESSION_REQUESTS: "10",
    RATE_LIMIT_REQUESTS: "20",
    RATE_LIMIT_WINDOW_MS: "3600000",
    PROVIDER_TIMEOUT_MS: "2000",
    APPROVED_RESOURCE_HOSTS: "neurothinkhub.com,nhs.uk,gov.uk,samaritans.org",
  };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/chat", () => {
  test("returns an answer while preserving the approved provider model and structured optional context", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "Try one small step." }],
      }),
    });
    vi.stubGlobal("fetch", providerFetch);
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "How can I make meetings easier?",
      history: [],
      sessionId: "session-success-123456",
      context: {
        supportFor: "employee",
        setting: "workplace",
        answerStyle: "checklist",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe("Try one small step.");
    expect(res.body.answerId).toMatch(/^ans_[a-f0-9-]+$/);

    const providerRequest = JSON.parse(providerFetch.mock.calls[0][1].body);
    expect(providerRequest.model).toBe("claude-haiku-4-5-20251001");
    expect(providerRequest.max_tokens).toBe(250);
    expect(providerRequest.messages).toEqual([
      { role: "user", content: "How can I make meetings easier?" },
    ]);
    expect(providerRequest.system).toContain(
      "Support is being sought for: employee",
    );
    expect(providerRequest.system).toContain("Support setting: workplace");
    expect(providerRequest.system).toContain(
      "Preferred answer style: checklist",
    );
  });

  test.each([
    [undefined, "Please enter a question."],
    ["", "Please enter a question."],
    [
      "x".repeat(121),
      "Your question is too long. Please shorten it to 120 characters or fewer.",
    ],
  ])("rejects missing or excessive input", async (question, message) => {
    vi.stubGlobal("fetch", vi.fn());
    const handler = await loadHandler();
    const res = await call(handler, {
      question,
      sessionId: "session-validation-123456",
      context: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(message);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("rate limits repeated requests without calling the provider again", async () => {
    process.env.RATE_LIMIT_REQUESTS = "1";
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Answer" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);
    const handler = await loadHandler();
    const body = {
      question: "A question",
      sessionId: "session-rate-limit-123456",
      context: {},
    };

    expect((await call(handler, body)).statusCode).toBe(200);
    const limited = await call(handler, body);

    expect(limited.statusCode).toBe(429);
    expect(limited.body.error).toContain("Too many requests");
    expect(providerFetch).toHaveBeenCalledTimes(1);
  });

  test("enforces the per-session request limit independently of IP rate limiting", async () => {
    process.env.MAX_SESSION_REQUESTS = "1";
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Answer" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);
    const handler = await loadHandler();
    const body = {
      question: "A question",
      sessionId: "session-limit-123456",
      context: {},
    };

    expect((await call(handler, body)).statusCode).toBe(200);
    const limited = await call(handler, body, {
      headers: { "x-forwarded-for": "203.0.113.11" },
    });

    expect(limited.statusCode).toBe(429);
    expect(limited.body.error).toContain("session limit");
  });

  test("returns a safe provider error without exposing credentials or provider details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "server-test-key invalid",
      }),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "Help me plan a task",
      sessionId: "session-provider-error-123456",
      context: {},
    });

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe(
      "Ask NeuroThinkHub is temporarily unavailable. Please try again shortly.",
    );
    expect(JSON.stringify(res.body)).not.toContain("server-test-key");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain(
      "server-test-key",
    );
  });

  test("returns a user-friendly timeout response", async () => {
    process.env.PROVIDER_TIMEOUT_MS = "5";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (url, options) =>
          new Promise((resolve, reject) => {
            options.signal.addEventListener("abort", () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            });
          }),
      ),
    );
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "Help me plan a task",
      sessionId: "session-timeout-123456",
      context: {},
    });

    expect(res.statusCode).toBe(504);
    expect(res.body.error).toBe(
      "The answer took too long. Please try again with a shorter question.",
    );
  });

  test("pauses API access when pilot mode is disabled", async () => {
    process.env.PILOT_MODE_ENABLED = "false";
    vi.stubGlobal("fetch", vi.fn());
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "Can I ask something?",
      sessionId: "session-paused-123456",
      context: {},
    });

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toContain("pilot is paused");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails closed when the pilot-mode switch is missing", async () => {
    delete process.env.PILOT_MODE_ENABLED;
    vi.stubGlobal("fetch", vi.fn());
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "Can I ask something?",
      sessionId: "session-no-switch-123456",
      context: {},
    });

    expect(res.statusCode).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("supplies the complete safety and response guidance to the provider", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Answer" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);
    const handler = await loadHandler();

    await call(handler, {
      question: "What might help?",
      sessionId: "session-safety-123456",
      context: {},
    });

    const system = JSON.parse(providerFetch.mock.calls[0][1].body).system;
    expect(system).toMatch(/inclusive, strengths-based and non-clinical/i);
    expect(system).toMatch(/Never diagnose/i);
    expect(system).toMatch(
      /barriers, practical supports and meaningful choice/i,
    );
    expect(system).toMatch(/Avoid assumptions/i);
    expect(system).toMatch(/Explain unfamiliar terminology/i);
    expect(system).toMatch(/short headings and manageable steps/i);
    expect(system).toMatch(/alternatives/i);
    expect(system).toMatch(/accessibility and safety/i);
    expect(system).toMatch(/uncertain/i);
    expect(system).toMatch(/urgent or emergency/i);
    expect(system).toMatch(/approved resource/i);
  });

  test("uses a concise response budget unless a detailed explanation is selected", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Answer" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);
    const handler = await loadHandler();

    await call(handler, {
      question: "What might help?",
      sessionId: "session-concise-123456",
      context: {},
    });
    await call(handler, {
      question: "Please explain this fully.",
      sessionId: "session-detailed-123456",
      context: { answerStyle: "detailed-explanation" },
    });

    const conciseRequest = JSON.parse(providerFetch.mock.calls[0][1].body);
    const detailedRequest = JSON.parse(providerFetch.mock.calls[1][1].body);
    expect(conciseRequest.max_tokens).toBeLessThan(detailedRequest.max_tokens);
    expect(conciseRequest.system).toMatch(/no more than 150 words/i);
    expect(detailedRequest.system).toMatch(/up to 350 words/i);
  });

  test("limits the returned answer and removes links to unapproved hosts", async () => {
    process.env.MAX_RESPONSE_CHARACTERS = "80";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text:
                "Use https://example.com/private and https://www.nhs.uk/help for support. " +
                "x".repeat(100),
            },
          ],
        }),
      }),
    );
    const handler = await loadHandler();

    const res = await call(handler, {
      question: "Share a trusted source",
      sessionId: "session-links-123456",
      context: {},
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.reply.length).toBeLessThanOrEqual(80);
    expect(res.body.reply).not.toContain("example.com");
    expect(res.body.reply).toContain("nhs.uk");
  });
});
