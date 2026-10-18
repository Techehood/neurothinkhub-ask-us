import { useEffect, useRef, useState } from "react";
import { PATTERNS_CONFIG, resolvePattern } from "./config/patterns.js";
import "./styles.css";

const MAX_QUESTION_CHARACTERS = 1500;

const PERSONA_OPTIONS = [
  ["neurodivergent", "Neurodivergent"],
  ["manager", "Manager"],
  ["hr-ld", "HR / L&D"],
  ["parent-family", "Parent / Family"],
  ["educator", "Educator"],
  ["entrepreneur", "Entrepreneur"],
  ["ally-professional", "Ally / Professional"],
];

const VOICE_MESSAGES = {
  unsupported:
    "Voice input works in Chrome and Edge. In this browser, please type your question.",
  blocked:
    "The microphone is blocked. Allow microphone access in your browser settings, or type your question.",
  noSpeech: "We didn't hear anything. Try again, or type your question.",
  failed: "Voice input isn't working here. Please type your question instead.",
};

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

const FIRST_STEPS = [
  "Share who you are (optional).",
  "Describe your situation or question.",
  "Ask follow-up questions to go deeper.",
];

const CONTEXT_FIELDS = [
  {
    key: "setting",
    label: "Where is support needed?",
    options: [
      ["education", "Education"],
      ["workplace", "Workplace"],
      ["home", "Home"],
      ["wellbeing", "Wellbeing"],
      ["entrepreneurship", "Entrepreneurship"],
    ],
  },
  {
    key: "answerStyle",
    label: "How would you like the answer?",
    options: [
      ["quick-steps", "Quick steps"],
      ["checklist", "Checklist"],
      ["examples", "Examples"],
      ["detailed-explanation", "Detailed explanation"],
    ],
  },
];

const STARTER_PROMPTS = [
  "What could make it easier to start a difficult task?",
  "How can instructions be made clearer and easier to follow?",
  "What practical support could help in a busy environment?",
];

const SPECTRUM_GRID_URL = "https://neurothinkhub.com/spectrum-grid/";

const SIDE_ITEMS = {
  left: [
    { label: "ADHD", href: SPECTRUM_GRID_URL },
    { label: "Dyslexia", href: SPECTRUM_GRID_URL },
    { label: "Autism", href: SPECTRUM_GRID_URL },
    { label: "Dyspraxia", href: SPECTRUM_GRID_URL },
    { label: "Dyscalculia", href: SPECTRUM_GRID_URL },
    { label: "Sensory processing", href: SPECTRUM_GRID_URL },
  ],
  right: [
    { label: "Self-discovery" },
    { label: "Workplace tools" },
    { label: "Coaching" },
    { label: "Community" },
    { label: "Workshops" },
  ],
};

const DRAFT_KEPT_MESSAGE =
  "Your draft is still in the text box below so you will not lose your thoughts.";

function readPatternFromUrl() {
  try {
    return resolvePattern(
      new URLSearchParams(window.location.search).get("pattern"),
    );
  } catch {
    return null;
  }
}

function PatternPills({ activePattern, onSelect }) {
  return (
    <div
      className="pattern-pills"
      role="group"
      aria-label="Shape responses to a pattern of need"
    >
      {Object.keys(PATTERNS_CONFIG).map((key) => {
        const pattern = PATTERNS_CONFIG[key];
        const isActive = activePattern?.key === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(key)}
            className={isActive ? "pattern-pill is-active" : "pattern-pill"}
          >
            <span className="pattern-pill-driver">{pattern.driver}:</span>{" "}
            {pattern.title}
          </button>
        );
      })}
    </div>
  );
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID)
    return `session_${globalThis.crypto.randomUUID()}`;
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function PersonaSelector({ persona, onChange }) {
  return (
    <section className="persona-panel" aria-labelledby="persona-heading">
      <div className="section-heading-row">
        <div>
          <h2 id="persona-heading">I am…</h2>
          <p>
            Choose one so answers can speak to your situation. This is optional.
          </p>
        </div>
        {persona && (
          <button
            className="text-button"
            type="button"
            onClick={() => onChange("")}
          >
            Skip / clear
          </button>
        )}
      </div>
      <div className="persona-grid" role="radiogroup" aria-label="I am…">
        {PERSONA_OPTIONS.map(([value, label]) => {
          const isActive = persona === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={isActive ? "persona-chip is-active" : "persona-chip"}
              onClick={() => onChange(isActive ? "" : value)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FirstSteps() {
  return (
    <ol className="first-steps" aria-label="How to use Ask NeuroThinkHub">
      {FIRST_STEPS.map((step, index) => (
        <li key={step}>
          <span className="first-step-number" aria-hidden="true">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ContextChoices({ context, onChange }) {
  return (
    <section className="context-panel" aria-labelledby="context-heading">
      <div className="section-heading-row">
        <div>
          <h2 id="context-heading">Optional preferences</h2>
          <p>Choose any that help, or skip them and ask your question now.</p>
        </div>
        {Object.keys(context).length > 0 && (
          <button
            className="text-button"
            type="button"
            onClick={() => onChange({})}
          >
            Clear choices
          </button>
        )}
      </div>
      <div className="context-grid">
        {CONTEXT_FIELDS.map((field, index) => (
          <label key={field.key} className="select-field">
            <span>
              {index + 1}. {field.label}
            </span>
            <select
              value={context[field.key] || ""}
              onChange={(event) =>
                onChange({
                  ...context,
                  [field.key]: event.target.value || undefined,
                })
              }
            >
              <option value="">Skip this choice</option>
              {field.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}

function SidePanel({ title, titleHref, items }) {
  return (
    <aside className="side-panel" aria-label={title}>
      <div className="tree-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>
        {titleHref ? (
          <a
            className="side-panel-link"
            href={titleHref}
            target="_top"
            rel="noopener"
          >
            {title}
          </a>
        ) : (
          title
        )}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a
                className="side-panel-link"
                href={item.href}
                target="_top"
                rel="noopener"
              >
                {item.label}
              </a>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function renderInlineFormatting(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function AnswerContent({ content }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h3 className="answer-heading" key={`heading-${index}`}>
          {renderInlineFormatting(heading[1], `heading-${index}`)}
        </h3>,
      );
      index += 1;
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (ordered || unordered) {
      const items = [];
      const matcher = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*]\s+(.+)$/;
      while (index < lines.length) {
        const item = lines[index].trim().match(matcher);
        if (!item) break;
        items.push(
          <li key={`item-${index}`}>
            {renderInlineFormatting(item[1], `item-${index}`)}
          </li>,
        );
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={`list-${index}`}>{items}</List>);
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,6}\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {renderInlineFormatting(paragraphLines.join(" "), `paragraph-${index}`)}
      </p>,
    );
  }

  return <>{blocks}</>;
}

function FeedbackControls({ message, conversation }) {
  const [status, setStatus] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [detail, setDetail] = useState("");
  const [includeConversation, setIncludeConversation] = useState(false);

  async function submitFeedback(rating, extra = {}) {
    setStatus("Sending feedback…");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId: message.answerId, rating, ...extra }),
      });
      if (!response.ok) throw new Error("feedback request failed");
      setStatus("Thank you for your feedback.");
      setReportOpen(false);
    } catch {
      setStatus("Feedback could not be sent. Please try again.");
    }
  }

  function submitConcern(event) {
    event.preventDefault();
    submitFeedback("concern", {
      detail: detail.trim() || undefined,
      includeConversation,
      ...(includeConversation ? { conversation } : {}),
    });
  }

  return (
    <div className="feedback">
      <div
        className="feedback-actions"
        role="group"
        aria-label="Was this answer helpful?"
      >
        <span>Was this helpful?</span>
        <button type="button" onClick={() => submitFeedback("helpful")}>
          Helpful
        </button>
        <button type="button" onClick={() => submitFeedback("partly-helpful")}>
          Partly helpful
        </button>
        <button type="button" onClick={() => submitFeedback("not-helpful")}>
          Not helpful
        </button>
        <button type="button" onClick={() => setReportOpen((open) => !open)}>
          Report a concern
        </button>
      </div>

      {reportOpen && (
        <form className="concern-form" onSubmit={submitConcern}>
          <label>
            What concerned you? <span>(optional, 500 characters maximum)</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={includeConversation}
              onChange={(event) => setIncludeConversation(event.target.checked)}
            />
            Include this conversation with my report. This is optional and off
            by default.
          </label>
          <button type="submit">Send concern report</button>
        </form>
      )}

      {status && (
        <p className="feedback-status" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}

export default function App() {
  const [persona, setPersona] = useState("");
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [activePattern, setActivePattern] = useState(readPatternFromUrl);
  const [input, setInput] = useState(() => activePattern?.seedPrompt ?? "");
  const [isPreFilled, setIsPreFilled] = useState(() => Boolean(activePattern));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const inputRef = useRef(null);
  const newestAnswerRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(createSessionId());

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== "assistant" || !newestAnswerRef.current) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    newestAnswerRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    newestAnswerRef.current.focus({ preventScroll: true });
    setAnnouncement("Answer ready.");
  }, [messages]);

  async function sendMessage(text) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setIsPreFilled(false);
    setLoading(true);
    setError("");
    setAnnouncement("");

    try {
      const mergedContext = Object.fromEntries(
        Object.entries(context).filter(([, value]) => value),
      );
      if (persona) mergedContext.persona = persona;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history,
          context: mergedContext,
          sessionId: sessionIdRef.current,
          ...(activePattern ? { patternKey: activePattern.key } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply, answerId: data.answerId },
      ]);
    } catch (requestError) {
      // Put the question back so the draft-kept message stays true.
      setMessages((current) => current.slice(0, -1));
      setInput(question);
      setError(
        `${
          requestError.message ||
          "Could not reach Ask NeuroThinkHub. Please check your connection and try again."
        } ${DRAFT_KEPT_MESSAGE}`,
      );
      setAnnouncement("The answer could not be prepared.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function toggleListening() {
    if (loading) return;
    if (!SpeechRecognitionAPI) {
      setVoiceMessage(VOICE_MESSAGES.unsupported);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setInput(transcript.slice(0, MAX_QUESTION_CHARACTERS));
      setIsPreFilled(false);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "aborted") return;
      setVoiceMessage(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? VOICE_MESSAGES.blocked
          : event.error === "no-speech"
            ? VOICE_MESSAGES.noSpeech
            : VOICE_MESSAGES.failed,
      );
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceMessage("");
    recognition.start();
    setListening(true);
  }

  function handlePatternSelect(key) {
    const matched = resolvePattern(key);
    if (!matched) return;
    setActivePattern(matched);
    // Only replace the input if it holds nothing the visitor wrote.
    if (!input.trim() || isPreFilled) {
      setInput(matched.seedPrompt);
      setIsPreFilled(true);
    }
  }

  // Shared by the banner dismiss and "Start a blank conversation".
  function clearPattern() {
    setActivePattern(null);
    if (isPreFilled) setInput("");
    setIsPreFilled(false);
  }

  function handleClearPattern() {
    clearPattern();
    inputRef.current?.focus();
  }

  function startAgain() {
    if (
      messages.length > 0 &&
      !window.confirm(
        "Clear this conversation and start fresh? Your current chat will be lost.",
      )
    )
      return;
    clearPattern();
    setMessages([]);
    setInput("");
    setError("");
    setAnnouncement("Conversation removed from the screen.");
    sessionIdRef.current = createSessionId();
    inputRef.current?.focus();
  }

  const conversationForFeedback = messages.map(({ role, content }) => ({
    role,
    content,
  }));

  const placeholder = listening
    ? "Listening…"
    : "Describe your situation or ask a question…";

  return (
    <div className="app-shell">
      <SidePanel
        title="Neurodiversity topics"
        titleHref={SPECTRUM_GRID_URL}
        items={SIDE_ITEMS.left}
      />

      <main className="chat-card">
        <header className="app-header">
          <div className="title-row">
            <div>
              <h1>Ask NeuroThinkHub</h1>
            </div>
            {(messages.length > 0 || activePattern) && (
              <button
                type="button"
                className="secondary-button"
                onClick={startAgain}
              >
                Start a blank conversation
              </button>
            )}
          </div>
          <div
            className="pilot-notice"
            role="note"
            aria-label="About Ask NeuroThinkHub"
          >
            <strong>Ask NeuroThinkHub provides general guidance.</strong>
            <span>
              {" "}
              It does not diagnose or replace medical, legal, safeguarding or
              emergency support.
            </span>
          </div>
          <p className="privacy-notice">
            Protect your privacy: do not submit names, addresses, medical
            records or confidential workplace information.
          </p>
          <PatternPills
            activePattern={activePattern}
            onSelect={handlePatternSelect}
          />
        </header>

        <PersonaSelector persona={persona} onChange={setPersona} />

        <FirstSteps />

        <ContextChoices context={context} onChange={setContext} />

        <section className="conversation" aria-label="Conversation">
          {activePattern && (
            <div className="active-pattern-banner" role="status">
              <span>
                Shaping responses for: <strong>{activePattern.title}</strong>
                {" — "}
                <em>{activePattern.humanVoice}</em>
              </span>
              <button
                type="button"
                className="secondary-button"
                onClick={handleClearPattern}
              >
                Switch to blank chat
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="starters">
              <p className="empty-state">
                This space adapts to your pattern of need.
              </p>
              <p>Ask your own question now, or try one of these:</p>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => {
            const isNewestAnswer =
              message.role === "assistant" &&
              !messages
                .slice(index + 1)
                .some((later) => later.role === "assistant");

            if (message.role === "user") {
              return (
                <div
                  className="message user-message"
                  key={`${index}-${message.content}`}
                >
                  {message.content}
                </div>
              );
            }

            return (
              <article
                className="answer-block"
                key={message.answerId || `${index}-${message.content}`}
                aria-label="Answer from Ask NeuroThinkHub"
                tabIndex={-1}
                ref={isNewestAnswer ? newestAnswerRef : null}
              >
                <div className="message assistant-message">
                  <AnswerContent content={message.content} />
                </div>
                <FeedbackControls
                  message={message}
                  conversation={conversationForFeedback}
                />
              </article>
            );
          })}

          {loading && (
            <p className="loading-status" role="status">
              Preparing a calm, structured response…
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>

        <div className="composer">
          <label htmlFor="question">Your question</label>
          {isPreFilled && activePattern && (
            <p className="editable-cue" id="editable-cue">
              Editable starter prompt — change the bracketed text or rewrite
              freely
            </p>
          )}
          <div className="composer-row">
            <textarea
              id="question"
              ref={inputRef}
              className={isPreFilled ? "is-prefilled" : undefined}
              aria-describedby={
                isPreFilled && activePattern ? "editable-cue" : undefined
              }
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (isPreFilled) setIsPreFilled(false);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={MAX_QUESTION_CHARACTERS}
              placeholder={placeholder}
              rows={2}
            />
            <button
              type="button"
              className={listening ? "voice-button is-active" : "voice-button"}
              onClick={toggleListening}
              disabled={loading}
              aria-label={
                listening ? "Stop voice input" : "Speak your question"
              }
              title={listening ? "Stop voice input" : "Speak your question"}
            >
              {listening ? <StopIcon /> : <MicIcon />}
            </button>
            <button
              type="button"
              className="send-button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? "Working…" : "Send message"}
            </button>
          </div>
          {voiceMessage && (
            <p className="voice-message" role="status">
              {voiceMessage}
            </p>
          )}
          <p className="character-count">
            {input.length} of {MAX_QUESTION_CHARACTERS} characters
          </p>
        </div>
      </main>

      <SidePanel title="Support options" items={SIDE_ITEMS.right} />
    </div>
  );
}
