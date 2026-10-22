# AETHRION Platform: Developer, Teams and Diagnostics

## Developer Platform
- The browser page calls the existing authenticated Parse Cloud Code API-key functions. Secret API keys are displayed only in the creation response; they are not written to the page's permanent key list.
- Each newly created key stores an `allowed_scopes` array. Supported scopes in this release:
  - `chat`: required by `v27ApiChat` and `v27ApiRest`.
  - `usage:read`: required by `aethrionGetApiUsage`.
- Legacy keys without `allowed_scopes` are treated as `chat` only. This is a least-privilege migration default.
- Key list, active key count/limit, revocation, API docs and a manual API test console are provided. The existing per-account key limit and existing rate limits remain the enforced quotas; this does not claim billing-grade token budgets.
- Do not put production keys in frontend code or commit them to the repository.

## Teams
- Team membership is verified in Cloud Code. New invite/code joiners start as `viewer`; the team creator is `admin`.
- `viewer` is read-only for team messages and cannot complete team tasks.
- `editor` can send messages, edit their own messages, and complete team tasks.
- `admin`, team owner/manager, and platform admin/founder can perform the explicitly guarded team-management actions.
- Role changes are performed server-side and produce a server-side audit event.
- The Teams page provides team selection, member role management (where authorized), and the audit timeline.
- This role matrix is enforced only for the Cloud Code operations explicitly guarded in this release. Any additional project mutation function must be reviewed and guarded before treating it as fully role-enforced.

## Status & Diagnostics
- The status panel is hidden from non-admin/non-founder sessions in the UI; the Cloud Code function independently enforces the same roles.
- Checks return status categories and sanitized summaries. A provider key being configured does not prove a successful model generation; some checks only probe a provider's model-list endpoint.
- Vercel status requires server-side `VERCEL_READONLY_TOKEN` and `VERCEL_PROJECT_ID`, and optionally `VERCEL_TEAM_ID`. Do not expose these values to the browser.
- Browser errors are summarized without displaying raw server errors.

## Audit privacy
- New audit events avoid email/name fields. Actor and target references are pseudonymous hashes; target labels are generic.
- Existing historical audit rows may contain older email/name fields. An admin/founder can use the Status & Diagnostics privacy-cleanup control to scrub legacy rows in batches. Repeat the operation if it reports more records.
- Audit records are operational traces, not cryptographic proof or a transactional guarantee that an external action succeeded. Some older client-originated event categories may be incomplete.
- Do not claim every operation is audited until each relevant server-side mutation is instrumented and tested.

## Verification checklist
1. Run `node --check` on the JavaScript files in this change and `back4app/main.js`.
2. Deploy Cloud Code separately from the static website.
3. Test as a normal user, viewer, editor, team admin, platform admin, and founder.
4. Verify API key creation, scope rejection, usage read, and revocation.
5. Verify diagnostics denies normal users and never returns secret values.
6. Run the historical audit privacy cleanup if old audit records exist.
7. Verify Vercel deployment and the live UI only after the actual deployments complete.
