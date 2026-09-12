import { useEffect, useRef, useState } from "react";
import "./styles.css";

const MAX_QUESTION_CHARACTERS = 1500;

const CONTEXT_FIELDS = [
  {
    key: "supportFor",
    label: "Who are you seeking support for?",
    options: [
      ["myself", "Myself"],
      ["learner", "A learner"],
      ["employee", "An employee"],
      ["family-member", "A family member"],
      ["team", "A team"],
    ],
  },
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

const SIDE_ITEMS = {
  left: [
    "ADHD",
    "Dyslexia",
    "Autism",
    "Dyspraxia",
    "Dyscalculia",
    "Sensory processing",
  ],
  right: [
    "Self-discovery",
    "Workplace tools",
    "The Bridge",
    "Coaching",
    "Community",
    "Workshops",
  ],
};

function createSessionId() {
  if (globalThis.crypto?.randomUUID)
    return `session_${globalThis.crypto.randomUUID()}`;
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function ContextChoices({ context, onChange }) {
  return (
    <section className="context-panel" aria-labelledby="context-heading">
      <div className="section-heading-row">
        <div>
          <h2 id="context-heading">Optional choices</h2>
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

function SidePanel({ title, items }) {
  return (
    <aside className="side-panel" aria-label={title}>
      <div className="tree-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
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
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [listening, setListening] = useState(false);
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
    setLoading(true);
    setError("");
    setAnnouncement("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history,
          context: Object.fromEntries(
            Object.entries(context).filter(([, value]) => value),
          ),
          sessionId: sessionIdRef.current,
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
      setError(
        requestError.message ||
          "Could not reach Ask NeuroThinkHub. Please check your connection and try again.",
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
    if (!SpeechRecognitionAPI || loading) return;
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
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function startAgain() {
    if (
      !window.confirm(
        "Start again and remove this conversation from the screen?",
      )
    )
      return;
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

  return (
    <div className="app-shell">
      <SidePanel title="Neurodiversity topics" items={SIDE_ITEMS.left} />

      <main className="chat-card">
        <header className="app-header">
          <div className="title-row">
            <div>
              <p className="eyebrow">Pilot</p>
              <h1>Ask NeuroThinkHub</h1>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={startAgain}
              >
                Start Again
              </button>
            )}
          </div>
          <div
            className="pilot-notice"
            role="note"
            aria-label="Pilot information"
          >
            <strong>
              Ask NeuroThinkHub is a pilot providing general guidance.
            </strong>
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
        </header>

        <ContextChoices context={context} onChange={setContext} />

        <section className="conversation" aria-label="Conversation">
          {messages.length === 0 && (
            <div className="starters">
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
              Preparing your answer…
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
          <div className="composer-row">
            <textarea
              id="question"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={MAX_QUESTION_CHARACTERS}
              placeholder={listening ? "Listening…" : "Type your question…"}
              rows={2}
            />
            {SpeechRecognitionAPI && (
              <button
                type="button"
                className={
                  listening ? "voice-button is-active" : "voice-button"
                }
                onClick={toggleListening}
                disabled={loading}
                aria-label={
                  listening ? "Stop voice input" : "Speak your question"
                }
              >
                {listening ? "Stop" : "Speak"}
              </button>
            )}
            <button
              type="button"
              className="send-button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send question"
            >
              Send
            </button>
          </div>
          <p className="character-count">
            {input.length} of {MAX_QUESTION_CHARACTERS} characters
          </p>
        </div>
      </main>

      <SidePanel title="Support options" items={SIDE_ITEMS.right} />
    </div>
  );
}
