# Ask NeuroThinkHub

Ask NeuroThinkHub is a pilot React chat interface for general, non-diagnostic neuroinclusion guidance. The browser calls Vercel serverless routes; only the server route can read the Anthropic credential.

## Pilot safeguards

- Optional visitor context can be skipped or changed at any time.
- Questions and answers have server-enforced limits.
- IP and session request limits protect the chat route.
- The pilot fails closed unless its server-side switch is enabled.
- The prompt policy is version-controlled in `api/_lib/system-prompt.js`.
- Generated links are restricted to configured approved hosts.
- Raw conversations are not stored by the application by default.
- Minimal feedback is written server-to-server to Upstash Redis with automatic expiry; conversation text requires explicit consent.

## Local checks

```bash
npm install
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

## Environment variables

Copy `.env.example` to a local `.env` only when developing locally. Never commit `.env` files.

| Name                       | Required         | Purpose                                                                               |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`        | Yes              | Server-only Anthropic credential.                                                     |
| `PILOT_MODE_ENABLED`       | Yes              | Explicitly opens or pauses the pilot API. Missing configuration keeps the API paused. |
| `MAX_QUESTION_CHARACTERS`  | No               | Server question-size ceiling.                                                         |
| `MAX_RESPONSE_CHARACTERS`  | No               | Server answer-size ceiling after provider response.                                   |
| `MAX_RESPONSE_TOKENS`      | No               | Maximum tokens requested from the existing model.                                     |
| `MAX_SESSION_REQUESTS`     | No               | Requests allowed for one pilot session in the rate window.                            |
| `RATE_LIMIT_REQUESTS`      | No               | Requests allowed from one connection in the rate window.                              |
| `RATE_LIMIT_WINDOW_MS`     | No               | Length of the request-limit window.                                                   |
| `PROVIDER_TIMEOUT_MS`      | No               | Provider request timeout.                                                             |
| `APPROVED_RESOURCE_HOSTS`  | No               | Comma-separated host allow-list for response links.                                   |
| `UPSTASH_REDIS_REST_URL`   | Yes for feedback | Server-only URL provisioned by the Vercel Upstash integration.                        |
| `UPSTASH_REDIS_REST_TOKEN` | Yes for feedback | Server-only token provisioned by the Vercel Upstash integration.                      |
| `FEEDBACK_RETENTION_DAYS`  | No               | Feedback lifetime in days; defaults to and is capped at 30 days.                      |

## Operator documentation

- [Pilot operations](docs/PILOT-OPERATIONS.md)
- [Privacy and data handling](docs/PRIVACY-DATA-HANDLING.md)
- [Safety and escalation](docs/SAFETY-ESCALATION.md)
- [Deployment and rollback](docs/DEPLOYMENT-ROLLBACK.md)
