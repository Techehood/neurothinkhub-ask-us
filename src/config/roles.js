// "I am…" roles. The keys are the server's persona values, so the existing
// tuned answers (including the HR / L&D framing) keep working unchanged.

export const ROLE_OPTIONS = Object.freeze([
  { key: "parent-family", label: "a parent or family member" },
  { key: "educator", label: "an educator" },
  { key: "manager", label: "a manager" },
  { key: "hr-ld", label: "in HR or L&D" },
  { key: "neurodivergent", label: "a neurodivergent person" },
  { key: "entrepreneur", label: "an entrepreneur" },
  { key: "ally-professional", label: "an ally or professional" },
]);

// "Exploring" is a real choice that sends no role context.
export const EXPLORING_KEY = "exploring";
export const EXPLORING_LABEL = "exploring (not sure yet)";

const ROLE_KEYS = ROLE_OPTIONS.map((option) => option.key);

// Friendly ids for Baby Ask buttons on the WordPress site. Condition-based
// ids also set the matching topic (an explicit ?topic= still wins).
const ROLE_ALIASES = Object.freeze({
  parent: { role: "parent-family" },
  family: { role: "parent-family" },
  employer: { role: "manager" },
  hr: { role: "hr-ld" },
  ld: { role: "hr-ld" },
  autistic: { role: "neurodivergent", topic: "autism" },
  adhd: { role: "neurodivergent", topic: "adhd" },
  dyslexic: { role: "neurodivergent", topic: "dyslexia" },
  exploring: { role: EXPLORING_KEY },
});

/**
 * Strict allowlist validator for ?role=. Unknown values return null silently.
 * @param {unknown} rawParam
 * @returns {{ role: string, topic?: string } | null}
 */
export function parseRoleParam(rawParam) {
  if (!rawParam || typeof rawParam !== "string") return null;
  const normalised = rawParam.trim().toLowerCase();
  if (Object.hasOwn(ROLE_ALIASES, normalised)) return ROLE_ALIASES[normalised];
  if (ROLE_KEYS.includes(normalised)) return { role: normalised };
  return null;
}
