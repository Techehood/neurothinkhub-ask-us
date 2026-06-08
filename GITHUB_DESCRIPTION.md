# GitHub Repository Details

## Repository name
neurothinkhub-ask-us

## Short description (used in GitHub repo header — 1 line)
AI-powered neurodiversity advisor widget for neurothinkhub.com — persona-aware chat built with React, Vite, and Claude Haiku via a Vercel serverless API.

## README description (paste into README.md)

# Ask Us — NeuroThinkHub

Personalised AI guidance on neurodiversity, built for [NeuroThinkHub](https://neurothinkhub.com).

Visitors choose who they are — neurodivergent individual, manager, HR professional, parent/family member, educator, or neurodivergent entrepreneur — and receive guidance tailored to their lens. Powered by Claude Haiku for fast, empathetic, cost-efficient responses.

## What it does
- 6 persona-aware conversation modes with distinct system prompts
- Starter questions per persona to reduce blank-page friction
- ND-friendly UX: short responses, clear visual chunking, no walls of text
- Session-based rate limiting (15 requests/IP/hour) and message cap (10/session)
- "Book a free call" CTA linked to NeuroThinkHub contact page

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

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key from console.anthropic.com |

## Topics / tags (add these to GitHub repo topics)
neurodiversity, adhd, dyslexia, neuroinclusion, react, vite, vercel, claude-ai, anthropic, chatbot, accessibility
