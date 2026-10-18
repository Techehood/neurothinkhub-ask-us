# Patterns of Need

Patterns of need let a link open Ask NeuroThinkHub already shaped for one way of working. A pattern pre-fills an editable starter prompt in the browser and adds a response-shape guardrail to the system prompt on the server.

Patterns describe shifting needs, never fixed diagnostic labels. In visitor-facing text, always say "pattern of need", never "persona" or "friction".

## 1. The `?pattern=` URL contract

| Key          | Pattern                           | Core driver |
| ------------ | --------------------------------- | ----------- |
| `scaffolder` | The Executive Function Scaffolder | Clarity     |
| `sensory`    | The Sensory-Sensitive Worker      | Safety      |
| `masking`    | The Masking Professional          | Safety      |
| `translator` | The Creative Translator           | Agency      |

Example: `https://<app-host>/?pattern=sensory`

- The value is trimmed and lower-cased, so `?pattern=%20Sensory` resolves to `sensory`.
- Only the four keys above are accepted (`ALLOWED_PATTERN_KEYS`).
- Anything else falls back **silently** to a blank chat: unknown, empty, non-string or prototype names such as `__proto__`. The visitor sees no error.
- If the parameter is repeated (`?pattern=a&pattern=b`), only the first value is read, and it must still pass the allowlist.

The single validator is `resolvePattern()` in `src/config/patterns.js`. The browser and the server both call it.

## 2. Server authority rule

```
Browser                              Server (api/chat.js)
───────                              ────────────────────
?pattern= ─▶ resolvePattern()        req.body.patternKey ─▶ resolvePattern()
             │                                              │
             ▼                                              ▼
   seed prompt + banner          systemGuardrail from src/config/patterns.js
             │                   appended after the base prompt
             └─ POST { patternKey: "sensory", ... } ──────▶ │
                                                            ▼
                                   reply + activePatternKey ("sensory" or null)
```

- The browser sends **only the key**, as `patternKey`.
- The server re-validates it on every request and looks up the guardrail text in its own copy of the config.
- The server never accepts prompt or guardrail text from the browser. A tampered request can choose one of the four patterns or none, and nothing else.
- An invalid `patternKey` is ignored, and the request is answered as a blank chat.
- `activePatternKey` in the reply is the canonical key from config, never an echo of the raw input.
- The browser sends `patternKey` with **every** message while a pattern is active, so follow-up answers keep the same shape.

## 3. `patterns.js` schema

`src/config/patterns.js` is the single source of truth. Both `ALLOWED_PATTERN_KEYS` and `PATTERNS_CONFIG` are frozen with `Object.freeze`.

| Field             | Type                                | Used by | Purpose                                                                                                |
| ----------------- | ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `key`             | `PatternKey`                        | Both    | Canonical key; must match the object property name.                                                    |
| `driver`          | `"Clarity" \| "Safety" \| "Agency"` | Browser | Prefix shown on the pattern button.                                                                    |
| `title`           | string                              | Browser | Button and banner label.                                                                               |
| `humanVoice`      | string                              | Browser | First-person quote in the active pattern banner.                                                       |
| `seedPrompt`      | string                              | Browser | Pre-filled, editable starter prompt. Must contain one `[bracketed placeholder]`; a test enforces this. |
| `editableHint`    | string                              | —       | Per-pattern hint. Currently unused: the UI shows one shared "Editable starter prompt" cue instead.     |
| `systemGuardrail` | string                              | Server  | Mandatory response shape, appended after the base system prompt with a blank line.                     |

The response token budget per pattern lives on the server in `PATTERN_RESPONSE_TOKENS` (`api/chat.js`):

| Pattern    | Budget | Why                                                                                      |
| ---------- | ------ | ---------------------------------------------------------------------------------------- |
| sensory    | 200    | Enforces the under-100-words shape.                                                      |
| masking    | 500    | Two tone options.                                                                        |
| scaffolder | 600    | Starter action plus three stages.                                                        |
| translator | 1400   | Three variants of the visitor's text with "What changed" lines; grows with input length. |

Each budget is capped by `MAX_RESPONSE_TOKENS` (see section 6).

## 4. Adding a pattern (Phase 1.5)

1. **Pick a key.** Use lower case with no spaces, for example `planner`.
2. **Allowlist it.** Add the key to `ALLOWED_PATTERN_KEYS` and to the `PatternKey` JSDoc union in `src/config/patterns.js`.
3. **Configure it.** Add an entry to `PATTERNS_CONFIG` with every field in section 3. `key` must equal the property name.
4. **Write the guardrail.** Follow the existing shape: an `ACTIVE PATTERN OF NEED:` line, then `MANDATORY RESPONSE SHAPE:` as numbered rules, ending with the shared language rules.
5. **Set a budget.** Add the key to `PATTERN_RESPONSE_TOKENS` in `api/chat.js`. Without it, the pattern falls back to the default style budget of 250 tokens, which may cut long shapes short.
6. **Check the ceiling.** If the new budget is above `MAX_RESPONSE_TOKENS`, raise that variable in Vercel too.
7. **Test.** `npm run test:run` covers the allowlist, the schema and the bracketed placeholder automatically. Add a UI test if the pattern needs new behaviour.
8. **Link it.** Add the new `?pattern=` link to the WordPress pattern matrix (outside this repo).

No other code changes are needed: the buttons, banner, pre-fill and server injection all read from the config.

## 5. Audience choice ("I am…") contract

The "I am…" selector sets `context.persona`. This is the "audience key" in design notes; the wire field name is `persona`. Allowed values are listed in `CONTEXT_VALUES.persona` in `api/chat.js`.

| State                          | Selector                    | Sent to server                          |
| ------------------------------ | --------------------------- | --------------------------------------- |
| Blank chat, nothing chosen     | Shown                       | `context: {}`                           |
| Blank chat, choice made        | Shown                       | `context: { persona: "<value>" }`       |
| Pattern active                 | Hidden                      | `context: {}` (suppressed)              |
| Pattern cleared, back to blank | Shown, previous choice kept | `context: { persona: "<value>" }` again |

- **Why it's suppressed:** a pattern already shapes the answer, and audience guidance would muddle the system prompt.
- **Why it's kept in blank chat:** it is the only thing shaping blank-chat answers, including the UK framing (for example, HR / L&D always names the Equality Act 2010 and Access to Work).
- **State is preserved:** the choice is held in browser state while a pattern is active, and sent again once the visitor returns to blank chat.
- **Two different resets:** "Switch to blank chat" clears only the pattern. "Start a blank conversation" also clears the chat. Both use the same `clearPattern()` function.

The server still accepts `setting`, `supportFor` and `answerStyle` in `context`, but the MVP UI no longer sends them (the "Optional preferences" dropdowns were deferred to Phase 1.5).

## 6. `MAX_RESPONSE_TOKENS`

- **Current value:** `1400`, set in Vercel → Project → Settings → Environment Variables (Production, Preview and Development).
- **Code default:** `400` if the variable is unset (`api/_lib/pilot-config.js`).
- **Why 1400:** it is the largest pattern budget (translator). Preview testing at 400 cut the third variant off; long pasted input can need 1,200–1,400 tokens. Every request is capped at `min(MAX_RESPONSE_TOKENS, budget)`, so this value is a cost ceiling, not a target.
- **Side effect:** the built-in answer-style budgets (220–500) are also capped by it, so raising it never lifts them above their own limits.
- **Pair it with `MAX_RESPONSE_CHARACTERS`:** the server also trims answers by length (default 5,000 characters). A 1,400-token answer is about 5,600 characters, so this is set to `7000` in Vercel.
- **To change it:** edit the variable in Vercel, then redeploy. New values only apply to new deployments.

## 7. Cross-origin architecture

```
neurothinkhub.com (WordPress)                 Vercel (this repo)
─────────────────────────────                 ──────────────────
/ai-and-neurodiversity/
  pattern matrix widget
  links to /ask/?pattern=sensory
            │
            ▼
/ask/?pattern=sensory
  forwarding script copies ?pattern=
  onto the iframe src
            │
            ▼
  <iframe src="https://<app-host>/?pattern=sensory"> ──▶  React app reads ?pattern=
                                                          from its own URL
                                                                │ POST /api/chat
                                                                ▼   { patternKey }
                                                          api/chat.js ──▶ Anthropic API
```

- The app can only read its **own** URL. Browser cross-origin rules stop it from reading the parent WordPress page's address, so the WordPress forwarding script on `/ask/` must copy `?pattern=` onto the iframe `src`.
- The WordPress widget and forwarding script are maintained in the WordPress admin, not in this repo.
- `vercel.json` sends a `Permissions-Policy` header that allows the microphone for `https://neurothinkhub.com`, so voice input works inside the iframe.

## 8. Decisions log

| Decision                                 | Rationale                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript with JSDoc, not TypeScript    | The whole repo is Vite + React in JS. JSDoc gives editor types without a separate build path for one file.                                                            |
| Keep Claude Haiku 4.5                    | Fast and low-cost for a public chat, and the pattern guardrails constrain the shape enough.                                                                           |
| Server authority over guardrails         | Only a key crosses the trust boundary, so a crafted URL or request cannot inject prompt text.                                                                         |
| `Object.freeze` on the config            | Prevents accidental changes to patterns while the app is running.                                                                                                     |
| Per-pattern token budgets                | One fixed cap either cut long shapes (translator) or over-spent on short ones (sensory).                                                                              |
| Silent fallback for invalid keys         | A broken or old link still opens a working blank chat, with no error for the visitor.                                                                                 |
| Hide "I am…" while a pattern is active   | Patterns shape the answer; mixing in audience guidance muddles the prompt. It stays in blank chat, where it is the only shaper.                                       |
| Cut 1-2-3 steps and preference dropdowns | A calm-first screen should teach itself. Restore in Phase 1.5 only with user-research evidence. Server support is kept, so restoring is UI-only.                      |
| Keep the microphone in both modes        | Accessibility support for dyslexic visitors, visitors with motor-coordination differences, and anyone who thinks faster than they type.                               |
| No analytics in the MVP                  | Keeps the privacy posture simple while the pilot runs. The only data collected is opt-in answer feedback (see [Privacy and data handling](PRIVACY-DATA-HANDLING.md)). |

## 9. Phase 1.5 backlog

| Item                                 | Why                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tune "I am… Educator" guidance       | MVP testing was a soft pass: content was on-brand, but answers did not name EHCP, SENCO or UDL. Strengthen `PERSONA_GUIDANCE.educator` in `api/_lib/system-prompt.js`.                                    |
| Watch for brand-rule over-correction | One answer advised the visitor to avoid "superpower" language in their own writing. If it recurs, add: "These language rules apply to your own wording. Do not correct how visitors describe themselves." |
| Optional preferences and 1-2-3 steps | Removed for the calm-first MVP. Restore only with user-research evidence; the server still accepts `setting`, `supportFor` and `answerStyle`.                                                             |
| Copy, download and share             | MVP copies the whole answer. Per-variant copy, `.txt`/`.md` download, native share and whole-conversation export are deferred.                                                                            |
| `editableHint` per pattern           | Unused in the MVP UI, which shows one shared "Editable starter prompt" cue. Use it or remove it.                                                                                                          |
