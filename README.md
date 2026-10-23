# AETHRION — Intelligence Without Limits

AETHRION is a browser-based AI and productivity ecosystem deployed on Vercel from this GitHub repository.

## Main areas
- AETHRION AI conversational assistant and AETHRION JARVIS task-planning mode
- Browser-supported voice input and speech output where available and permitted
- AI model catalogue and A27 API documentation
- 3D Studio, code editor, video tools and learning resources
- Community, projects, team collaboration, account and security pages
- Turkish-first interface with responsive desktop and mobile layouts

## SEO structured data
The homepage's primary, crawlable JSON-LD graph is embedded in the root index.html. It describes AETHRION as an organization, website and software application, including its AI, voice-assistant, developer, team and creative-productivity areas. The JARVIS page is represented separately, without claiming that desktop control or autonomous external actions are enabled.

The external aethrion-schema.js is a fallback only: it detects an existing AETHRION Organization graph and does not append a duplicate graph. The GitHub Actions workflow .github/workflows/activate-aethrion-schema.yml ensures the fallback loader is referenced by the homepage if the tag is missing.

## Deployment layout
The repository uses the root as the Vercel static site root. There is no public/ directory. HTML, CSS, JavaScript, SVG, JSON and policy pages live at the root or under api/.

## VPN/proxy/Tor protection
The browser gate calls the Back4App Cloud Code function aethrionSecurityCheck using the site's existing Parse SDK. The IPQS key is read only by Back4App server-side Cloud Code through process.env.IPQS_API_KEY; it must never be placed in HTML, client JavaScript, Parse Config visible to clients, or source control. The browser sends no IP address; Back4App must use its trusted request.ip value. Missing configuration, unavailable IP data, or provider errors fail closed.

The legacy Vercel /api/security-check route has been removed so the site no longer depends on a separate Vercel IPQS secret for its browser gate. The gate blocks the visible page while the check is pending and stops access if the result is missing, blocked, or invalid. This is a browser access gate, not a substitute for an edge firewall/WAF; direct static assets may be served before client-side JavaScript runs.

## Back4App deployment
Upload back4app/main.js as the app's Cloud Code main.js, set IPQS_API_KEY as a private server-side environment variable, and deploy Cloud Code. Legacy function names are retained, including vizyonAlChat, vizyonAlScreenRead, vizyonAlLiveScreenStream, vizyonAlFileAnalyze, kocChat, getKocHistory, shareKocConversation, createV27ApiKey, createVideoClip, generate3DWithHF, sendFounderMessage and smartTranslate.

## Validation
GitHub Actions runs JavaScript syntax checks on the Cloud Code and browser security guard. Passing syntax checks do not replace live tests of login, AI providers, file analysis, rate limits, and VPN/proxy detection.

## AETHRION AI and JARVIS
- AETHRION AI is the standard conversational assistant.
- AETHRION JARVIS is a separate task-assistant mode with browser-based voice input/output where supported.
- The current frontend uses the existing vizyonAlChat Cloud Code function. Full screen streaming, desktop control, web/tool automation, persistent project memory and advanced agent orchestration require separate backend/provider work; they are not claimed as live in this frontend phase.
- The role policy and release checklist are in docs/ROLE-ACCESS-MATRIX.md and docs/RELEASE-AND-REGRESSION-CHECKLIST.md.
- See docs/AETHRION-ECOSYSTEM-JARVIS.md for the implementation contract.
