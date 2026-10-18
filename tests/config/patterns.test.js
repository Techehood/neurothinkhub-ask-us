import { describe, expect, it } from "vitest";
import {
  ALLOWED_PATTERN_KEYS,
  PATTERNS_CONFIG,
  resolvePattern,
} from "../../src/config/patterns.js";

describe("resolvePattern", () => {
  it.each(ALLOWED_PATTERN_KEYS)("resolves %s", (key) => {
    expect(resolvePattern(key)).toBe(PATTERNS_CONFIG[key]);
  });

  it("normalises case and whitespace", () => {
    expect(resolvePattern("  Sensory ")).toBe(PATTERNS_CONFIG.sensory);
  });

  it.each([
    null,
    undefined,
    "",
    "   ",
    "unknown",
    "__proto__",
    "constructor",
    "toString",
    "sensory;drop",
    ["sensory"],
    42,
  ])("returns null for %p", (value) => {
    expect(resolvePattern(value)).toBeNull();
  });
});

describe("PATTERNS_CONFIG", () => {
  it("has one entry per allowed key with a matching key field", () => {
    expect(Object.keys(PATTERNS_CONFIG).sort()).toEqual(
      [...ALLOWED_PATTERN_KEYS].sort(),
    );
    for (const key of ALLOWED_PATTERN_KEYS) {
      expect(PATTERNS_CONFIG[key].key).toBe(key);
    }
  });

  it("keeps a bracketed placeholder in every seed prompt", () => {
    for (const pattern of Object.values(PATTERNS_CONFIG)) {
      expect(pattern.seedPrompt).toMatch(/\[[^\]]+\]/);
    }
  });
});
