# AETHRION VPN / Proxy / Tor Protection

## Required secrets — both runtimes
1. In Vercel: Project Settings -> Environment Variables -> add `IPQS_API_KEY` for Production. Add Preview only if preview deployments should be protected.
2. In Back4App: configure the same `IPQS_API_KEY` as a private Cloud Code runtime environment secret. The Vercel key is not automatically shared with Back4App.
3. Deploy `back4app/main.js` as Back4App Cloud Code `main.js`.
4. Merge/deploy the website only after the Vercel key is configured.

## Enforcement
- `/api/security-check` performs a server-side IPQualityScore check and fails closed if the key is missing, the IP is unavailable, or the provider fails.
- `index.html` hides the page while the check is pending and displays a blocking screen for VPN/proxy/Tor or a failed/unconfigured check.
- `back4app/main.js` wraps externally invoked Parse Cloud functions with the same server-side IP reputation check. Trusted master-key internal calls bypass the outer gate so Cloud Code can call its own functions.
- A short in-memory cache reduces repeated provider requests; it is not persisted.

## Important limitations
The browser gate does not block the initial static HTML response before it reaches the browser. For true pre-response enforcement, configure a supported WAF/firewall rule at the hosting edge. IP reputation databases can produce false positives and cannot guarantee detection of every VPN or proxy. Test ordinary mobile-carrier, home and work connections as well as a known VPN.

## Recovery
If the provider is unavailable or a secret is missing, the gate intentionally blocks access. Correct the secret/provider configuration and redeploy; do not silently allow requests to pass.
