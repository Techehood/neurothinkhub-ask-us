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

The chat route applies a per-connection rate limit and a per-session request limit. These in-memory counters are best-effort within each serverless instance. A shared external rate-limit store is an outstanding production hardening item and must be approved before it is added.

No short inactivity timer is used. A session remains on screen until the visitor refreshes, closes the tab, or confirms Start Again.
