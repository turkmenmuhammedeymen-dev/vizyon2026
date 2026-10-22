# AETHRION — Intelligence Without Limits

AETHRION is a browser-based AI and productivity ecosystem deployed on Vercel from this GitHub repository.

## Main areas
- AI workspace and assistant interfaces
- Model catalogue and API documentation
- 3D Studio, code editor, video tools and learning resources
- Community, projects, account and security pages
- Turkish-first interface with responsive desktop and mobile layouts

## Deployment layout
The repository uses the root as the Vercel static site root. There is no `public/` directory. HTML, CSS, JavaScript, SVG, JSON and policy pages live at the root or under `api/`.

## VPN/proxy/Tor protection
The site gate uses `/api/security-check` and IPQualityScore. Set `IPQS_API_KEY` as a private Vercel environment variable for Production. The Back4App Cloud Code file in `back4app/main.js` independently checks direct Parse Cloud calls; configure the same secret separately in the Back4App server-side Cloud Code runtime. The Vercel secret is not automatically shared with Back4App. Never commit the key.

See [VPN-BLOCKING-SETUP.md](./VPN-BLOCKING-SETUP.md) and [CLOUD-CODE-DEPLOYMENT.md](./CLOUD-CODE-DEPLOYMENT.md). The browser gate runs after the HTML response begins; it is not a substitute for a WAF/edge firewall. IPQS/provider errors fail closed, so a missing secret or provider outage blocks access.

## Back4App deployment
Upload `back4app/main.js` as the app's Cloud Code `main.js`, deploy Cloud Code, then test authenticated and unauthenticated workflows. Legacy function names are retained, including `vizyonAlChat`, `vizyonAlScreenRead`, `vizyonAlLiveScreenStream`, `vizyonAlFileAnalyze`, `kocChat`, `getKocHistory`, `shareKocConversation`, `createV27ApiKey`, `createVideoClip`, `generate3DWithHF`, `sendFounderMessage` and `smartTranslate`.

## Validation
GitHub Actions runs JavaScript syntax checks on the Cloud Code and server-side security files. Passing syntax checks do not replace live tests of login, AI providers, file analysis, rate limits, and VPN/proxy detection.
