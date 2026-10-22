# AETHRION Ecosystem and JARVIS — Implementation Contract

Status: phased implementation plan; not a claim that every capability is live.

## Product split
- AETHRION AI: normal text/voice conversation, explanations and writing.
- AETHRION JARVIS: task planning and, after backend implementation, controlled tool use such as web research, user-selected file/screen analysis, supported browser actions, projects and reminders.
- A browser page cannot safely control the entire operating system by itself. Desktop control needs a local companion or an explicitly supported computer-use service.

## Required capabilities
1. Voice input/output, stop control, language selection, visible microphone state and text fallback.
2. Opt-in project memory with controls to inspect/delete saved data.
3. Multi-step plans with preview, progress, cancellation and recoverable errors.
4. Allowlisted tools, schema validation, least-privilege credentials and server-side authorization.
5. Web research with source links and timestamps.
6. Screen/file analysis only after explicit user selection and permission.
7. Confirmation before sending messages, changing settings, sharing content or submitting forms.
8. Provider/model selection, latency/cost/error telemetry, quotas and safe fallback.
9. Image/video/3D only when the configured provider actually supports it.
10. Status and diagnostics that never expose tokens or sensitive payloads.

## Role access
- Guest: public pages.
- User: own account/projects and standard AI.
- Moderator: scoped moderation tools only.
- Admin: explicitly assigned administrative tools.
- Founder: founder-only controls.
- Beta: only individually enabled beta features; never implicit administrator privileges.

Frontend visibility is not authorization. Every privileged Cloud Code function must check the authenticated user and required role server-side. Never trust a role sent by the browser. Do not grant moderator controls to every logged-in user.

## Security
- Keep provider keys server-side; never commit secrets or return them to the browser.
- Validate input, role, quota and object ownership server-side.
- Treat model output, tool arguments, files and webpages as untrusted.
- Require confirmation for irreversible/external actions.
- Redact tokens and personal data from logs.
- Do not claim end-to-end encryption, anonymity or guaranteed VPN detection unless verified.
- Provide a kill switch for tool execution and provider outages.

## Acceptance criteria
- Every visible control works or is clearly marked unavailable.
- Voice works where browser speech APIs are supported, with text fallback.
- Ordinary users cannot directly invoke moderator/admin/founder Cloud Code functions.
- All legal links resolve and match actual providers, data flows, retention and contact details.
- Run HTML/link checks, JavaScript syntax checks and integration tests on a preview deployment.
- Verify Vercel frontend and Back4App Cloud Code deployments separately.
