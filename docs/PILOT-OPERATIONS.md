# Pilot operation instructions

## Open the pilot

1. Confirm the approved resource hosts and that Upstash Redis is connected only to this project.
2. Add `ANTHROPIC_API_KEY` as a server-side Vercel secret.
3. Set `PILOT_MODE_ENABLED=true` only in the environment being opened.
4. Redeploy that environment and test one valid question, one excessive question, one feedback rating and one concern report.

The provider and model are fixed in `api/chat.js`. Changing either requires separate permission and review.

## Pause API access

Use the switch before changing routes or deleting credentials:

1. In Vercel, open Project → Settings → Environment Variables.
2. Set `PILOT_MODE_ENABLED=false` for the affected environment.
3. Redeploy the latest approved commit to that environment.
4. Confirm `POST /api/chat` returns HTTP 503 with the pilot-paused message.

For an urgent hard stop, disable the deployment in Vercel after setting the switch. Do not expose, rotate or paste the provider key into logs or support tickets.

## Daily checks

- Check failed chat and feedback request counts; do not inspect or copy user content into incident notes.
- Review concern reports in the approved feedback system.
- Confirm Upstash feedback keys are expiring within 30 days.
- Confirm the link allow-list still contains only approved hosts.
- Pause the pilot if safeguarding ownership, Upstash Redis or provider access becomes unavailable.

## Request controls

The chat route applies three limits, all held in Upstash Redis so they are shared across serverless instances and survive restarts:

- **Per connection:** `RATE_LIMIT_REQUESTS` (default 15) per `RATE_LIMIT_WINDOW_MS` (default 1 hour).
- **Per session:** `MAX_SESSION_REQUESTS` (default 10) per the same window.
- **Daily ceiling across all visitors:** `DAILY_REQUEST_CEILING` (default 500), reset at midnight UTC. Once reached, every visitor sees the pilot-paused message until the reset. Only requests that pass the first two limits count towards it, so one noisy connection cannot use it up.

If Redis is unreachable, the route falls back to best-effort per-instance counters and logs `Shared rate limits unavailable; using instance limits`.

## Cost monitoring

Each answered request writes one JSON line to the Vercel runtime logs: `{"event":"chat_usage","pattern":…,"session":…,"inputTokens":…,"outputTokens":…,"stopReason":…}`. Each refused request writes `{"event":"chat_limited","reason":"ip"|"session"|"daily"}`. The session value is a one-way hash. No question, history or answer text is ever logged. A `stopReason` of `max_tokens` means an answer was cut off by its token budget.

The Anthropic console spend limit is the monthly backstop; the daily ceiling is the app-level one.

No short inactivity timer is used. A session remains on screen until the visitor refreshes, closes the tab, or confirms Start Again.
