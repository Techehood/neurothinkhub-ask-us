# GitHub Repository Details

## Repository name

neurothinkhub-ask-us

## Short description (used in GitHub repo header — 1 line)

Pilot neuroinclusion guidance widget for neurothinkhub.com — accessible React chat with server-side safety and privacy controls.

## README description (paste into README.md)

# Ask NeuroThinkHub

General, non-diagnostic guidance about neuroinclusion, built for [NeuroThinkHub](https://neurothinkhub.com).

Visitors can ask immediately or use three optional choices to shape practical, strengths-based guidance. The existing Claude Haiku integration remains behind a protected Vercel serverless route.

## What it does

- Optional support-for, setting and answer-style choices
- Pilot, privacy, safety and escalation notices
- Keyboard, screen-reader, reduced-motion and mobile support
- Voice input using the browser Web Speech API where available
- Server-only API credentials, request limits, timeouts and safe errors
- Versioned response guidance and approved-resource link filtering
- Consent-gated concern reports and minimal feedback records

## Tech stack

- **Frontend**: React 18 + Vite
- **API**: Vercel Serverless Function (Node.js)
- **AI model**: Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic API
- **Hosting**: Vercel (free tier)
- **Estimated cost**: ~£2–5/month at normal traffic

## Setup

1. Clone this repo
2. Run `npm install`
3. Add your API key to `.env` (see `.env.example`)
4. Run `npm run dev` to test locally

For full deploy instructions, see [DEPLOY.md](./DEPLOY.md).

## Environment variables

See `.env.example` and `README.md` for the complete variable-name list. Never commit values.

## Topics / tags (add these to GitHub repo topics)

neurodiversity, adhd, dyslexia, neuroinclusion, react, vite, vercel, claude-ai, anthropic, chatbot, accessibility
