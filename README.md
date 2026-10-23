# AETHRION — Intelligence Without Limits

AETHRION is a browser-based AI and productivity ecosystem deployed on Vercel from this GitHub repository.

## Main areas
- AI workspace and assistant interfaces
- Model catalogue and API documentation
- 3D Studio, code editor, video tools and learning resources
- Community, projects, account and security pages
- Turkish-first interface with responsive desktop and mobile layouts

## SEO structured data
The refreshed JSON-LD graph is maintained in `aethrion-schema.js` and describes AETHRION as an organization, website and browser-based web application. It includes the documented AI, developer and creative productivity areas, while avoiding claims that planned JARVIS/desktop-control functions are already live.

**Activation required:** the script must be referenced from the root `index.html` inside its `<head>`:
```html
<script src="/aethrion-schema.js" defer></script>
```
The GitHub connector returned an empty body for the current large `index.html`, so that file was not overwritten blindly. Until the script tag is added to the live HTML, the new JSON-LD file exists in the repository but will not be emitted on the website.

## Deployment layout
The repository uses the root as the Vercel static site root. There is no `public/` directory. HTML, CSS, JavaScript, SVG, JSON and policy pages live at the root or under `api/`.

## VPN/proxy/Tor protection
The browser gate calls the Back4App Cloud Code function `aethrionSecurityCheck` using the site's existing Parse SDK. The IPQS key is read only by Back4App server-side Cloud Code through `process.env.IPQS_API_KEY`; it must never be placed in HTML, client JavaScript, Parse Config visible to clients, or source control. The browser sends no IP address; Back4App must use its trusted `request.ip` value. Missing configuration, unavailable IP data, or provider errors fail closed.

The legacy Vercel `/api/security-check` route has been removed so the site no longer depends on a separate Vercel IPQS secret for its browser gate. The gate blocks the visible page while the check is pending and stops access if the result is missing, blocked, or invalid. This is a browser access gate, not a substitute for an edge firewall/WAF; direct static assets may be served before client-side JavaScript runs.

## Back4App deployment
Upload `back4app/main.js` as the app's Cloud Code `main.js`, set `IPQS_API_KEY` as a private server-side environment variable, and deploy Cloud Code. Legacy function names are retained, including `vizyonAlChat`, `vizyonAlScreenRead`, `vizyonAlLiveScreenStream`, `vizyonAlFileAnalyze`, `kocChat`, `getKocHistory`, `shareKocConversation`, `createV27ApiKey`, `createVideoClip`, `generate3DWithHF`, `sendFounderMessage` and `smartTranslate`.

## Validation
GitHub Actions runs JavaScript syntax checks on the Cloud Code and browser security guard. Passing syntax checks do not replace live tests of login, AI providers, file analysis, rate limits, and VPN/proxy detection.

## AETHRION AI and JARVIS
- AETHRION AI is the standard conversational assistant.
- AETHRION JARVIS is the separate task-assistant mode with browser-based voice input/output where supported.
- The current frontend uses the existing `vizyonAlChat` Cloud Code function. Full screen streaming, desktop control, web/tool automation, persistent project memory and advanced agent orchestration require separate backend/provider work; they are not claimed as live in this frontend-only phase.
- The role policy and release checklist are in `docs/ROLE-ACCESS-MATRIX.md` and `docs/RELEASE-AND-REGRESSION-CHECKLIST.md`.
- See `docs/AETHRION-ECOSYSTEM-JARVIS.md` for the implementation contract.
