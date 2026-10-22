import { describe, expect, it } from "vitest";
import {
  ALLOWED_TOPIC_KEYS,
  TOPICS_CONFIG,
  resolveTopic,
  topicHubUrl,
} from "../../src/config/topics.js";
import { parseRoleParam, ROLE_OPTIONS } from "../../src/config/roles.js";
import {
  MAX_QUESTION_CHARACTERS,
  parseAskParams,
} from "../../src/config/askParams.js";
import { resolvePattern } from "../../src/config/patterns.js";

describe("topics", () => {
  it.each(ALLOWED_TOPIC_KEYS)("resolves %s with a /topics/ hub path", (key) => {
    expect(resolveTopic(key)).toBe(TOPICS_CONFIG[key]);
    expect(TOPICS_CONFIG[key].hubPath).toBe(`/topics/${key}/`);
  });

  it("normalises case and rejects unknown values", () => {
    expect(resolveTopic(" ADHD ")).toBe(TOPICS_CONFIG.adhd);
    for (const bad of [null, "", "nope", "__proto__", ["adhd"], 3]) {
      expect(resolveTopic(bad)).toBeNull();
    }
  });

  it("only links to a hub once it is live", () => {
    expect(topicHubUrl(TOPICS_CONFIG.adhd)).toBeNull();
  });
});

describe("roles", () => {
  it("accepts live keys and plain aliases", () => {
    expect(parseRoleParam("manager").role).toBe("manager");
    expect(parseRoleParam("parent").role).toBe("parent-family");
    expect(parseRoleParam("employer").role).toBe("manager");
    expect(parseRoleParam("exploring").role).toBe("exploring");
  });

  it("maps condition ids to a neurodivergent role plus topic", () => {
    expect(parseRoleParam("autistic")).toMatchObject({
      role: "neurodivergent",
      topic: "autism",
    });
  });

  it("ignores unknown and prototype values", () => {
    for (const bad of ["admin", "__proto__", "constructor", null, 5]) {
      expect(parseRoleParam(bad)?.role ?? null).toBeNull();
    }
  });

  it("keeps the seven live roles", () => {
    expect(ROLE_OPTIONS).toHaveLength(7);
  });
});

describe("parseAskParams", () => {
  it("returns blanks for an empty query", () => {
    expect(parseAskParams("")).toEqual({
      topic: null,
      pattern: null,
      role: "",
      question: "",
    });
  });

  it("reads all four parameters", () => {
    const result = parseAskParams(
      "?topic=dyslexia&pattern=clarity&role=educator&question=Help%20me",
    );
    expect(result.topic?.key).toBe("dyslexia");
    expect(result.pattern).toBe(resolvePattern("scaffolder"));
    expect(result.role).toBe("educator");
    expect(result.question).toBe("Help me");
  });

  it("lets an explicit topic win over a role-implied one", () => {
    expect(parseAskParams("?role=adhd&topic=autism").topic?.key).toBe("autism");
    expect(parseAskParams("?role=adhd").topic?.key).toBe("adhd");
  });

  it("sanitises and caps the question", () => {
    const messy = `?question=${encodeURIComponent("a\u0000b\n\n c" + "x".repeat(900))}`;
    const { question } = parseAskParams(messy);
    expect(question.startsWith("a b c")).toBe(true);
    expect(question).toHaveLength(MAX_QUESTION_CHARACTERS);
  });
});
