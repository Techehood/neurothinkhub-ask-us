// Suggested prompts for the adaptive text zone. They change with the chosen
// role and topic; a chosen pattern pre-fills its own seed prompt instead.

const GENERAL = [
  "What could make it easier to start a difficult task?",
  "How can instructions be made clearer and easier to follow?",
  "What practical support could help in a busy environment?",
];

// {topic} becomes the chosen topic's label, or a neutral phrase.
const ROLE_STARTERS = {
  "parent-family": [
    "What helps at home with {topic}?",
    "How can I explain what helps to school?",
    "How can I support without taking over?",
  ],
  educator: [
    "What classroom changes help with {topic}?",
    "How can I make instructions clearer for learners?",
    "Which reasonable adjustments are worth trying first?",
  ],
  manager: [
    "How can I support a team member with {topic}?",
    "What does a good conversation about adjustments look like?",
    "Which low-cost changes help most?",
  ],
  "hr-ld": [
    "How can we make adjustments work without a diagnosis?",
    "What should our policies say about {topic}?",
    "How do we train managers on {topic}?",
  ],
  neurodivergent: [
    "What could make {topic} easier at work?",
    "How do I explain what I need at work?",
    "What helps in a busy or noisy environment?",
  ],
  entrepreneur: [
    "How can I set up my business around how I work best?",
    "What helps with {topic} when I run a business?",
    "How do I plan when my energy varies?",
  ],
  "ally-professional": [
    "How can I be a better ally to colleagues with {topic}?",
    "What language should I avoid?",
    "How can I make my meetings easier for everyone?",
  ],
};

const FALLBACK_TOPIC_PHRASE = "being neurodivergent";

/**
 * @param {{ topicLabel?: string, role?: string }} selection
 * @returns {string[]}
 */
export function getStarterPrompts({ topicLabel = "", role = "" } = {}) {
  const roleSet = Object.hasOwn(ROLE_STARTERS, role)
    ? ROLE_STARTERS[role]
    : null;
  if (roleSet) {
    return roleSet.map((template) =>
      template.replace("{topic}", topicLabel || FALLBACK_TOPIC_PHRASE),
    );
  }
  if (topicLabel) {
    return [
      `What should I know about ${topicLabel}?`,
      `What practical support helps with ${topicLabel}?`,
      `What everyday barriers can come with ${topicLabel}, and what helps?`,
    ];
  }
  return GENERAL;
}
