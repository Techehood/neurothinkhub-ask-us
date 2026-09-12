// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
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

async function call(body) {
  const handler = (await import("../../api/feedback.js")).default;
  const res = responseRecorder();
  await handler({ method: "POST", body }, res);
  return res;
}

beforeEach(() => {
  vi.resetModules();
  process.env.FEEDBACK_WEBHOOK_URL = "https://feedback.internal.example/record";
  process.env.FEEDBACK_WEBHOOK_TOKEN = "feedback-test-token";
  process.env.FEEDBACK_RETENTION_DAYS = "30";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.FEEDBACK_WEBHOOK_URL;
  delete process.env.FEEDBACK_WEBHOOK_TOKEN;
  delete process.env.FEEDBACK_RETENTION_DAYS;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/feedback", () => {
  test.each(["helpful", "partly-helpful", "not-helpful"])(
    "records only minimal %s feedback",
    async (rating) => {
      const res = await call({ answerId: "ans_12345678", rating });

      expect(res.statusCode).toBe(202);
      expect(res.body).toEqual({ recorded: true });
      const event = JSON.parse(fetch.mock.calls[0][1].body);
      expect(event).toMatchObject({ answerId: "ans_12345678", rating });
      expect(event.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(event.deleteAfter).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Date.parse(event.deleteAfter)).toBeGreaterThan(
        Date.parse(event.recordedAt),
      );
      expect(event).not.toHaveProperty("conversation");
      expect(event).not.toHaveProperty("ip");
      expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
        "Bearer feedback-test-token",
      );
    },
  );

  test("records a bounded concern detail without attaching conversation by default", async () => {
    const res = await call({
      answerId: "ans_concern123",
      rating: "concern",
      detail: "The emergency wording was unclear.",
      includeConversation: false,
    });

    expect(res.statusCode).toBe(202);
    const event = JSON.parse(fetch.mock.calls[0][1].body);
    expect(event.detail).toBe("The emergency wording was unclear.");
    expect(event).not.toHaveProperty("conversation");
  });

  test("rejects invalid ratings and excessive concern details", async () => {
    expect(
      (await call({ answerId: "ans_12345678", rating: "great" })).statusCode,
    ).toBe(400);
    expect(
      (
        await call({
          answerId: "ans_12345678",
          rating: "concern",
          detail: "x".repeat(501),
        })
      ).statusCode,
    ).toBe(400);
  });

  test("rejects conversation data unless the visitor explicitly consents", async () => {
    const res = await call({
      answerId: "ans_12345678",
      rating: "concern",
      includeConversation: false,
      conversation: [{ role: "user", content: "Private details" }],
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("consent");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("attaches a bounded conversation only after explicit consent", async () => {
    const conversation = [
      { role: "user", content: "What could help?" },
      { role: "assistant", content: "Try one change." },
    ];
    const res = await call({
      answerId: "ans_12345678",
      rating: "concern",
      includeConversation: true,
      conversation,
    });

    expect(res.statusCode).toBe(202);
    const event = JSON.parse(fetch.mock.calls[0][1].body);
    expect(event.conversation).toEqual(conversation);
    expect(event.conversationConsent).toBe(true);
  });

  test("returns a safe error when feedback recording is not configured or unavailable", async () => {
    delete process.env.FEEDBACK_WEBHOOK_URL;
    expect(
      (await call({ answerId: "ans_12345678", rating: "helpful" })).statusCode,
    ).toBe(503);

    process.env.FEEDBACK_WEBHOOK_URL =
      "https://feedback.internal.example/record";
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const unavailable = await call({
      answerId: "ans_12345678",
      rating: "helpful",
    });
    expect(unavailable.statusCode).toBe(502);
    expect(unavailable.body.error).toBe(
      "Feedback could not be recorded. Please try again later.",
    );
    expect(JSON.stringify(unavailable.body)).not.toContain(
      "feedback-test-token",
    );
    expect(JSON.stringify(console.error.mock.calls)).not.toContain(
      "feedback-test-token",
    );
  });
});
