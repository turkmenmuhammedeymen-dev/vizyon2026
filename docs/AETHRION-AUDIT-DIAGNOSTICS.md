# AETHRION Audit & Diagnostics

## Project audit trail
- Cloud Code records team-scoped project events in the `AethrionProjectAudit` class.
- Only authenticated team members can submit an allowlisted event; only team members/owners/managers/admins/founder can read the relevant team's audit trail.
- Fields are limited to actor identity, team ID, action code, target ID/label and timestamp. Message bodies, project contents, access tokens, passwords, API keys and arbitrary metadata are intentionally excluded.
- Audit entries are attributed to the authenticated server-side user, never a client-supplied actor.
- Client-reported events are evidence of a submitted event, not cryptographic proof that a separate external action succeeded. For critical actions, emit audit records inside the exact server-side operation after successful mutation.

## Status & Diagnostics
- Only admin/founder roles can call the diagnostic Cloud Code function.
- It checks the active session, a low-impact database query, Parse Config access, probes configured OpenAI/DeepSeek/Groq/OpenRouter/DeepInfra/Cerebras/Gemini/NVIDIA model-list endpoints with GET requests, and optionally queries the latest Vercel deployment when `VERCEL_READONLY_TOKEN`, `VERCEL_PROJECT_ID`, and optionally `VERCEL_TEAM_ID` are configured.
- Secret values are never returned. Provider "configured" status is not equivalent to an end-to-end model request succeeding.
- Vercel deployment state is queried only when a read-only Vercel API token and project identifier are explicitly configured server-side. Otherwise it is reported as unavailable/unknown.
- Errors are classified into auth, database, configuration and provider-configuration categories. Diagnostic details are static/sanitized; do not persist request bodies or raw exception payloads.


## Cloud Code configuration
- The diagnostic function reads the actual key names used by the current Cloud Code: `OPENAI_KEY`, `DEEPSEEK_KEY`, `GROQ_KEY`, `OPENROUTER_KEY`, `DEEPINFRA_KEY`, `CEREBRAS_KEY`, `GEMINI_KEY`, `NVIDIA_API_KEY`, and `IPQS_API_KEY`.
- The NVIDIA probe also requires `NVIDIA_BASE_URL`.
- Optional Vercel status checks require `VERCEL_READONLY_TOKEN` and `VERCEL_PROJECT_ID`; configure `VERCEL_TEAM_ID` when the project belongs to a team.
- Provider probes can fail because of provider network policies, expired credentials, quotas or endpoint configuration. No key values or raw response bodies are returned.
