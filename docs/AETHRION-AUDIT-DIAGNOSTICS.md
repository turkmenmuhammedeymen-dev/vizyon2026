# AETHRION Audit & Diagnostics

## Project audit trail
- Cloud Code records team-scoped project events in the `AethrionProjectAudit` class.
- Only authenticated team members can submit an allowlisted event; only team members/owners/managers/admins/founder can read the relevant team's audit trail.
- Fields are limited to actor identity, team ID, action code, target ID/label and timestamp. Message bodies, project contents, access tokens, passwords, API keys and arbitrary metadata are intentionally excluded.
- Audit entries are attributed to the authenticated server-side user, never a client-supplied actor.
- Client-reported events are evidence of a submitted event, not cryptographic proof that a separate external action succeeded. For critical actions, emit audit records inside the exact server-side operation after successful mutation.

## Status & Diagnostics
- Only admin/founder roles can call the diagnostic Cloud Code function.
- It checks the active session, a low-impact database query, Parse Config access, and whether expected provider configuration keys are present.
- Secret values are never returned. Provider "configured" status is not equivalent to an end-to-end model request succeeding.
- Vercel deployment state cannot be accurately reported unless a read-only Vercel API token and project identifiers are explicitly configured server-side. This implementation must report that status as unknown, not fabricate a result.
- Errors are classified into auth, database, configuration and provider-configuration categories. Diagnostic details are static/sanitized; do not persist request bodies or raw exception payloads.
