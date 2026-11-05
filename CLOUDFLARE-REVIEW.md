# Cloudflare Qwen professional rewrite

Prepared 2026-11-05 for the user's zero-cost implementation request.

## Current verification

- 63 local tests passed; production build passed.
- Quota migration `cloudflare_review_daily_quotas` applied in Supabase.
- Rollback-only database verification: first two reservations allowed, third rejected, unauthenticated claim rejected. Anonymous role cannot execute; authenticated role cannot insert/update/delete counters directly. No synthetic account or count persisted.
- Security advisor's RLS-without-policy notice is intentional for the private counts table: no direct client access is granted. Existing leaked-password-protection warning is outside this change.
- No live model request, real quality evaluation, hosted browser verification, or production activation yet. Cloudflare account login is pending user action.

## Flow and boundaries

The existing local review is preserved. A separate opt-in card requests a rewrite for one selected section. The user must sign in, consent to sending that text to Cloudflare, review the suggested text, and explicitly apply it. The original is retained, newer edits cannot be overwritten, and undo restores exact original text. Account saves and publishing remain separate. English profile content is not automatically translated or changed.

Server validation checks same-origin POST, consent, input size, and a confirmed Supabase user via `/auth/v1/user`. A database RPC reserves a daily attempt before inference, with an advisory lock serializing claims across server instances. Limits: 2 attempts per account and 50 per site per UTC day. Failed provider requests still count. The table stores only user ID, date and attempt count, not profile text. There is no automatic retry, paid model, or alternate provider.

The sole model is `@cf/qwen/qwen3-30b-a3b-fp8`, called through Cloudflare's OpenAI-compatible API. Output is bounded, JSON is validated, new numeric claims are rejected, errors are sanitized. The prompt requires faithful professional rewriting with preserved uncertainty, negation, names and contribution; this is not a guarantee against hallucinations. Human review and real quality evaluation remain required.

## Activation prerequisites

1. User logs into or creates the project's Cloudflare account and accepts its terms themselves. Stay on Workers Free. Do not add payment, paid plan or AI Gateway prepaid credits.
2. Verify free-plan status and model availability in that account. Create a scoped Workers AI token only after action-time user confirmation; save it privately and configure the production secret securely without printing it.
3. Run synthetic Arabic/mixed-language quality cases, review fidelity, runtime and actual neurons. Do not use user profiles for initial tests.
4. Configure server secrets/settings: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_TOKEN`, `ATHAR_AI_FREE_ONLY_CONFIRMED=true`, `ATHAR_CLOUDFLARE_REWRITE=true`, and canonical `ATHAR_PUBLIC_ORIGIN`. Neither token nor account settings belong in frontend config. Without all gates, `/api/rewrite` still returns 410 and `/api/config` declares externalGeneration false.
5. Deploy and verify the full browser request → authentication → quota → provider → review → apply → undo flow with synthetic content, then mobile overflow and error states.

The free-only confirmation is an operator gate, not a provider billing lock. Cloudflare Workers Free's hard daily allocation stop is the financial backstop. If account billing is upgraded later, this deployment must be reviewed; do not imply a flag independently prevents all bills in a paid Cloudflare account. Existing hosting/database quotas are separate.

## References checked

- https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/
- https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://supabase.com/docs/reference/javascript/auth-getuser

DeepSeek preparation remains local and inactive; no DeepSeek key, private trial files or unrelated work should be included in this release.
