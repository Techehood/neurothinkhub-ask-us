# Deployment quick guide

This repository must use preview-first deployment.

1. Configure the environment-variable names listed in `.env.example` for the Preview environment. Keep credentials server-side.
2. Push a feature branch or run `vercel deploy` without `--prod`.
3. Run the verification checklist in `docs/DEPLOYMENT-ROLLBACK.md` against the preview URL.
4. Stop and obtain approval. Do not promote or deploy to production without that approval.

For pause, rollback and detailed checks, use [Deployment and rollback](docs/DEPLOYMENT-ROLLBACK.md).
