import { useEffect, useId, useState } from "react";
import { PATTERNS_CONFIG } from "../config/patterns.js";
import {
  EXPLORING_KEY,
  EXPLORING_LABEL,
  ROLE_OPTIONS,
} from "../config/roles.js";
import {
  ALLOWED_TOPIC_KEYS,
  TOPICS_CONFIG,
  topicHubUrl,
} from "../config/topics.js";

export const EXPLORE_TOPICS_URL = "https://neurothinkhub.com/spectrum-grid/";

/** True on phone-width screens, where each column becomes an accordion. */
export function useIsNarrow(query = "(max-width: 760px)") {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const update = () => setNarrow(list.matches);
    update();
    list.addEventListener?.("change", update);
    return () => list.removeEventListener?.("change", update);
  }, [query]);

  return narrow;
}

/**
 * One selector column. The subtitle is always visible. On narrow screens the
 * heading is a toggle button; the screen-reader description says what the
 * column does, so each column's behaviour is announced on entry.
 */
function ColumnPanel({
  title,
  subtitle,
  description,
  summary,
  narrow,
  children,
}) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const expanded = !narrow || open;
  const headingId = `${baseId}-heading`;
  const descriptionId = `${baseId}-description`;
  const bodyId = `${baseId}-body`;

  return (
    <section
      className="select-column"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <h2 className="select-column-title" id={headingId}>
        {narrow ? (
          <button
            type="button"
            className="select-column-toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((current) => !current)}
          >
            {title}
            <span className="select-column-chevron" aria-hidden="true">
              {open ? "−" : "+"}
            </span>
          </button>
        ) : (
          title
        )}
      </h2>
      <p className="select-column-subtitle">{subtitle}</p>
      {summary && <p className="select-column-summary">{summary}</p>}
      <p className="sr-only" id={descriptionId}>
        {description}
      </p>
      <div id={bodyId} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}

function RadioChips({ name, label, options, value, onChange, stacked }) {
  return (
    <div
      className={stacked ? "chip-list chip-list-stacked" : "chip-list"}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => (
        <label className="chip" key={option.key}>
          <input
            type="radio"
            name={name}
            value={option.key}
            checked={value === option.key}
            onChange={() => onChange(option.key)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function TopicColumn({ topic, onChange, onJustAsk, narrow }) {
  const hubUrl = topicHubUrl(topic);
  return (
    <ColumnPanel
      title="Topics"
      subtitle="What would you like to ask about?"
      description="Topics column, sets topic context"
      summary={topic ? `Selected: ${topic.label}` : ""}
      narrow={narrow}
    >
      <p className="select-hint">
        <strong>Pick the one that matters most today.</strong> More than one
        applies? Skip this and just ask. Tell us in your own words.
      </p>
      <RadioChips
        name="topic"
        label="Topics"
        options={ALLOWED_TOPIC_KEYS.map((key) => TOPICS_CONFIG[key])}
        value={topic?.key ?? ""}
        onChange={onChange}
      />
      <div className="select-actions">
        <button type="button" className="text-button" onClick={onJustAsk}>
          Just ask
        </button>
        {hubUrl && (
          <a className="select-link" href={hubUrl} target="_top" rel="noopener">
            Read the {topic.label} hub
          </a>
        )}
        <a
          className="select-link"
          href={EXPLORE_TOPICS_URL}
          target="_top"
          rel="noopener"
        >
          Explore all topics
        </a>
      </div>
    </ColumnPanel>
  );
}

export function PatternColumn({ activePattern, onSelect, narrow }) {
  const baseId = useId();
  return (
    <ColumnPanel
      title="Patterns"
      subtitle="Describe what's happening"
      description="Patterns column, opens Ask conversation"
      summary={activePattern ? `Selected: ${activePattern.title}` : ""}
      narrow={narrow}
    >
      <div
        className="pattern-card-list"
        role="group"
        aria-label="Shape responses to a pattern of need"
      >
        {Object.values(PATTERNS_CONFIG).map((pattern) => {
          const tagId = `${baseId}-${pattern.key}-tag`;
          const titleId = `${baseId}-${pattern.key}-title`;
          const descriptionId = `${baseId}-${pattern.key}-description`;
          const isActive = activePattern?.key === pattern.key;
          return (
            <button
              key={pattern.key}
              type="button"
              className={isActive ? "pattern-card is-active" : "pattern-card"}
              aria-pressed={isActive}
              aria-labelledby={`${tagId} ${titleId}`}
              aria-describedby={descriptionId}
              onClick={() => onSelect(pattern.key)}
            >
              <span className="pattern-card-tag" id={tagId}>
                {pattern.driver}
              </span>
              <span className="pattern-card-title" id={titleId}>
                {pattern.title}
              </span>
              <span className="pattern-card-desc" id={descriptionId}>
                {pattern.pickWhen}
              </span>
            </button>
          );
        })}
      </div>
    </ColumnPanel>
  );
}

export function RoleColumn({ roleChoice, onChange, narrow }) {
  const options = [
    ...ROLE_OPTIONS,
    { key: EXPLORING_KEY, label: EXPLORING_LABEL },
  ];
  const selected = options.find((option) => option.key === roleChoice);
  return (
    <ColumnPanel
      title="I am…"
      subtitle="Tell us who's asking"
      description="I am… column, sets role context"
      summary={selected ? `Selected: ${selected.label}` : ""}
      narrow={narrow}
    >
      <RadioChips
        name="role"
        label="I am…"
        options={options}
        value={roleChoice}
        onChange={onChange}
        stacked
      />
    </ColumnPanel>
  );
}
