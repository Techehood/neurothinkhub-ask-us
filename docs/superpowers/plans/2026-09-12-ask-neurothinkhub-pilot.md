# Ask NeuroThinkHub Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved safety, privacy, optional-context, feedback, accessibility, API-protection, documentation, and preview-deployment changes without changing the AI provider or model.

**Architecture:** Keep the Vite/React client and Vercel serverless API. Move the single response policy into a server-only module, validate and rate-limit requests before calling Anthropic, and send optional visitor context as structured fields. Store no chat by default; submit minimal feedback to a separate server route and include conversation text only after explicit consent.

**Tech Stack:** React 18, Vite 5, Vercel Functions, Anthropic Messages API, Vitest, Testing Library, axe-core, Playwright.

**Spec:** User-approved requirements supplied on 2026-09-12 in the implementation request.

## Global Constraints

- Implement only the approved pilot changes on `codex/ask-neurothinkhub-pilot`.
- Preserve working features.
- Keep Anthropic and `claude-haiku-4-5-20251001` unchanged.
- Never expose or commit credentials.
- Do not deploy to production; stop after a preview deployment.

---

### Task 1: Server safety boundary

**Files:**

- Create: `api/_lib/pilot-config.js`
- Create: `api/_lib/system-prompt.js`
- Create: `api/_lib/rate-limit.js`
- Modify: `api/chat.js`
- Test: `tests/api/chat.test.js`

**Interfaces:**

- Consumes: `{ question, history, context, sessionId }` JSON requests.
- Produces: validated `{ reply, answerId }` responses and stable 400, 429, 503, 504, and 502 errors.

- [ ] Write route tests for success, missing input, excessive input, rate limiting, provider failure, timeout, pilot pause, prompt safety rules, optional context, and output limits.
- [ ] Run `npm test -- tests/api/chat.test.js` and confirm each new behaviour fails because it is absent.
- [ ] Implement server-only configuration, prompt, validation, session/IP limits, timeout, safe error handling, response truncation, and approved-host link filtering.
- [ ] Run `npm test -- tests/api/chat.test.js` and confirm all route tests pass.

### Task 2: Optional context and accessible chat

**Files:**

- Modify: `src/App.jsx`
- Create: `src/styles.css`
- Test: `tests/ui/App.test.jsx`

**Interfaces:**

- Consumes: visitor selections and typed/voice questions.
- Produces: keyboard-operable chat requests with visible, editable structured context and predictable announcements/focus.

- [ ] Write UI tests for skippable choices, structured API context, accessible labels, keyboard send, loading text, answer focus, feedback controls, reduced-motion-compatible styling, and confirmed Start Again.
- [ ] Run `npm test -- tests/ui/App.test.jsx` and confirm failures are caused by the missing pilot UI.
- [ ] Implement the pilot notice, privacy notice, optional selectors, immediate question entry, accessible live regions, answer focus, mobile layout, character counter, and confirmed reset.
- [ ] Run `npm test -- tests/ui/App.test.jsx` and confirm all UI tests pass.

### Task 3: Minimal feedback

**Files:**

- Create: `api/feedback.js`
- Test: `tests/api/feedback.test.js`

**Interfaces:**

- Consumes: rating, answer identifier, optional concern detail, explicit conversation consent, and optional conversation.
- Produces: a 202 acknowledgement and a redacted minimal structured event; rejects unconsented conversation text.

- [ ] Write failing tests for the three ratings, concern reporting, input limits, and consent-gated conversation attachment.
- [ ] Run `npm test -- tests/api/feedback.test.js` and verify the intended failures.
- [ ] Implement minimal feedback validation and recording without provider keys or raw chat by default.
- [ ] Run `npm test -- tests/api/feedback.test.js` and confirm all feedback tests pass.

### Task 4: Operator documentation and configuration

**Files:**

- Create: `.env.example`
- Create: `README.md`
- Create: `docs/PILOT-OPERATIONS.md`
- Create: `docs/PRIVACY-DATA-HANDLING.md`
- Create: `docs/SAFETY-ESCALATION.md`
- Create: `docs/DEPLOYMENT-ROLLBACK.md`
- Modify: `DEPLOY.md`
- Modify: `package.json`

**Interfaces:**

- Consumes: documented environment variable names and Vercel operator actions.
- Produces: reproducible install, test, preview, pause, deletion, deployment, and rollback procedures.

- [ ] Add test/tool dependencies and scripts without changing runtime provider dependencies.
- [ ] Document every environment-variable name with no secret values.
- [ ] Document no-default-chat-storage, feedback fields, purpose, location, retention/deletion responsibilities, escalation, API pause, preview, and exact rollback steps.
- [ ] Run `npm run format:check`, `npm run typecheck`, `npm run test:run`, and `npm run build`.

### Task 5: Preview verification and delivery

**Files:**

- Test: `tests/e2e/pilot.spec.js`

**Interfaces:**

- Consumes: built preview URL.
- Produces: verified preview deployment only.

- [ ] Run the local end-to-end keyboard and accessible-name checks.
- [ ] Review `git diff` against every approved requirement and confirm no provider/model change.
- [ ] Commit and push `codex/ask-neurothinkhub-pilot`.
- [ ] Create a Vercel preview deployment without `--prod` and inspect its status.
- [ ] Report branch, changed files, checks, preview URL, manual environment variables, risks, and exact rollback; wait for approval.
