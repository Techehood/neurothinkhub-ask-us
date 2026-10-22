// Topics the visitor can pick in Ask. Only the key crosses the trust boundary:
// the server resolves it here, so free text never reaches the system prompt.
// hubLive stays false until the WordPress hub page at hubPath is published.

export const ALLOWED_TOPIC_KEYS = Object.freeze([
  "adhd",
  "autism",
  "dyslexia",
  "dyspraxia",
  "dyscalculia",
  "tourette",
  "ocd",
  "sensory-processing",
]);

/** @typedef {typeof ALLOWED_TOPIC_KEYS[number]} TopicKey */

/**
 * @typedef {object} TopicConfig
 * @property {TopicKey} key
 * @property {string} label
 * @property {string} hubPath
 * @property {boolean} hubLive
 */

const HUB_ORIGIN = "https://neurothinkhub.com";

/** @type {Readonly<Record<TopicKey, TopicConfig>>} */
export const TOPICS_CONFIG = Object.freeze({
  adhd: {
    key: "adhd",
    label: "ADHD",
    hubPath: "/topics/adhd/",
    hubLive: false,
  },
  autism: {
    key: "autism",
    label: "Autism",
    hubPath: "/topics/autism/",
    hubLive: false,
  },
  dyslexia: {
    key: "dyslexia",
    label: "Dyslexia",
    hubPath: "/topics/dyslexia/",
    hubLive: false,
  },
  dyspraxia: {
    key: "dyspraxia",
    label: "Dyspraxia",
    hubPath: "/topics/dyspraxia/",
    hubLive: false,
  },
  dyscalculia: {
    key: "dyscalculia",
    label: "Dyscalculia",
    hubPath: "/topics/dyscalculia/",
    hubLive: false,
  },
  tourette: {
    key: "tourette",
    label: "Tourette syndrome",
    hubPath: "/topics/tourette/",
    hubLive: false,
  },
  ocd: { key: "ocd", label: "OCD", hubPath: "/topics/ocd/", hubLive: false },
  "sensory-processing": {
    key: "sensory-processing",
    label: "Sensory processing",
    hubPath: "/topics/sensory-processing/",
    hubLive: false,
  },
});

/**
 * Strict allowlist validator for ?topic= and the server's topicKey field.
 * Unknown or malformed values return null silently.
 * @param {unknown} rawParam
 * @returns {TopicConfig | null}
 */
export function resolveTopic(rawParam) {
  if (!rawParam || typeof rawParam !== "string") return null;
  const normalised = rawParam.trim().toLowerCase();
  return ALLOWED_TOPIC_KEYS.includes(/** @type {TopicKey} */ (normalised))
    ? TOPICS_CONFIG[/** @type {TopicKey} */ (normalised)]
    : null;
}

/**
 * The hub link is offered only once the page is live, so no visitor lands on
 * a missing page.
 * @param {TopicConfig | null} topic
 * @returns {string | null}
 */
export function topicHubUrl(topic) {
  return topic?.hubLive ? `${HUB_ORIGIN}${topic.hubPath}` : null;
}
