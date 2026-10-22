import { resolvePattern } from "./patterns.js";
import { parseRoleParam } from "./roles.js";
import { resolveTopic } from "./topics.js";

export const MAX_QUESTION_CHARACTERS = 500;

/**
 * Reads the four deep-link parameters used by Baby Ask buttons:
 * ?topic= ?pattern= ?role= ?question=
 * Every value is checked against an allowlist; anything else is ignored, so a
 * bad link degrades to the normal blank start. ?question= only pre-fills the
 * text box and is never sent automatically.
 * @param {string} search
 */
export function parseAskParams(search) {
  const params = new URLSearchParams(search);
  const pattern = resolvePattern(params.get("pattern"));
  const roleParsed = parseRoleParam(params.get("role"));
  const topic =
    resolveTopic(params.get("topic")) ?? resolveTopic(roleParsed?.topic);

  const rawQuestion = params.get("question");
  const question =
    typeof rawQuestion === "string"
      ? rawQuestion
          .replace(/[\u0000-\u001F\u007F]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, MAX_QUESTION_CHARACTERS)
      : "";

  return { topic, pattern, role: roleParsed?.role ?? "", question };
}
