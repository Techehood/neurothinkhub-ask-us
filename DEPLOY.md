# Deployment quick guide

This repository must use preview-first deployment.

1. Install Upstash Redis from Vercel Marketplace and connect it only to this project.
2. Configure the remaining environment-variable names listed in `.env.example` for the Preview environment. Keep credentials server-side; Upstash provisions its URL and token automatically.
3. Push a feature branch or run `vercel deploy` without `--prod`.
4. Run the verification checklist in `docs/DEPLOYMENT-ROLLBACK.md` against the preview URL.
5. Stop and obtain approval. Do not promote or deploy to production without that approval.

For pause, rollback and detailed checks, use [Deployment and rollback](docs/DEPLOYMENT-ROLLBACK.md).
