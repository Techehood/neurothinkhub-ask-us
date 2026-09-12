# Deployment and rollback instructions

## Preview deployment

1. Work from `codex/ask-neurothinkhub-pilot`, never `main`.
2. Run `npm ci`, `npm run format:check`, `npm run typecheck`, `npm run test:run` and `npm run build`.
3. Install and connect the Vercel Marketplace Upstash Redis integration, then configure the Preview environment using every required name listed in `.env.example`.
4. Create a preview through the branch’s Git integration or run `vercel deploy` without `--prod`.
5. Verify the deployment status is Ready and confirm the URL is a preview alias, not the production domain.
6. Test keyboard-only question entry, all optional choices, loading text, answer focus, each feedback option, mobile layout, excessive input, rate limiting, provider failure and pilot pause.
7. Stop and wait for written production approval.

Never run `vercel --prod`, `vercel deploy --prod`, `vercel promote`, merge to the production branch, or change the production alias during the preview step.

## Exact rollback procedure

If a preview fails:

1. Set `PILOT_MODE_ENABLED=false` in the Preview environment and redeploy to pause API calls.
2. In Vercel Deployments, open the last known-good preview deployment created from the base `main` commit.
3. Reassign only the preview alias to that deployment, or delete the failed preview deployment if it has no needed logs.
4. In Git, leave `main` unchanged. Revert the failing feature-branch commit with `git revert <commit-sha>`; do not force-push shared history.
5. Push the revert to `codex/ask-neurothinkhub-pilot` and allow Vercel to create a new preview.
6. Re-run the full preview checklist before enabling the pilot switch.

If pilot code is later approved and released to production, rollback is:

1. Set `PILOT_MODE_ENABLED=false` in Production and redeploy immediately.
2. Run `vercel rollback <last-known-good-production-deployment-url-or-id>` or use Vercel’s Rollback control for that exact deployment.
3. Confirm the production alias points to the intended deployment.
4. Verify `/api/chat`, the embedded page and feedback behaviour.
5. Revert the release commit on `main` with `git revert <release-commit-sha>` and open a reviewed corrective pull request.
