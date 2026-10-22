# AETHRION VPN / Proxy / Tor Protection

## Architecture
- The website calls the Back4App Cloud Code function `aethrionSecurityCheck` through the already initialized Parse SDK.
- Back4App reads `IPQS_API_KEY` from a private server-side environment variable and calls IPQualityScore.
- The browser does not send an IP address or API key. The Cloud Code handler uses the platform-provided `request.ip`.
- The gate displays a checking screen until a valid response arrives; blocked connections and any missing/invalid check fail closed.
- The same Cloud Code policy wraps other externally called Parse Cloud Functions, so direct Cloud Function requests are checked too.

## Back4App setup
1. In Back4App, set `IPQS_API_KEY` under the app's server-side Cloud Code Environment Variables. Do not rely on a client-readable Parse Config value.
2. Deploy `back4app/main.js` as Cloud Code `main.js`.
3. Inspect Cloud Code startup logs for syntax or initialization errors.
4. Test `aethrionSecurityCheck` through the browser and test a normal connection plus a known VPN/proxy/Tor connection.

## Vercel
The website no longer uses the Vercel `/api/security-check` route for IP reputation checks; the route was removed. No Vercel IPQS secret is required for this gate. Vercel continues to host the static website, and a deployment is still needed to publish frontend changes.

## Important limitations
- This browser gate is not an edge firewall. Static HTML can reach the browser before the JavaScript check runs, although the checking overlay covers the page after script execution.
- Back4App must supply a trustworthy `request.ip`. If the platform cannot provide it, the function intentionally blocks access rather than accepting a user-supplied IP.
- IP reputation databases can produce false positives and cannot guarantee detection of every VPN or proxy.
- Provider outage, missing server-side secret, or invalid provider response intentionally blocks access.
