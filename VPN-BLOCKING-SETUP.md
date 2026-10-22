# AETHRION VPN / Proxy Protection

## What the current implementation does

- `/api/security-check` checks the visitor IP with IPQualityScore.
- The browser gate on `index.html` fails closed: a detected VPN/proxy/Tor connection, missing configuration, invalid response, or failed reputation check prevents use of the main site.
- The provider API key is server-only. Never place it in HTML, CSS, client JavaScript, or public repository files.

## Required Vercel configuration

1. Open the Vercel project connected to this repository.
2. Go to **Settings → Environment Variables**.
3. Add `IPQS_API_KEY` using the private API key from the IPQualityScore account.
4. Enable it for **Production**. Enable Preview only if you also want preview deployments protected.
5. Redeploy the latest `main` commit.
6. Test once with an ordinary connection and once with a known VPN/proxy connection.

**Important:** If `IPQS_API_KEY` is absent, the main page is intentionally blocked rather than silently allowing access. Configure the key before expecting the site to open.

## Enforcement limitation

This repository is deployed as a static Vercel site. The current gate blocks use of the main page in the browser after the reputation check; it does **not** reject the original HTTP request before HTML is served, and it does not independently protect direct third-party Parse/Back4App API calls. Browser-side checks can be bypassed by a technically capable visitor.

For strict site-wide enforcement, also configure a Vercel Firewall/WAF rule or a supported edge middleware in the deployment architecture, and enforce the same policy on backend/API endpoints. That requires access to the Vercel project settings and cannot be activated by a repository commit alone.

VPN reputation services can produce false positives. Verify normal mobile-carrier, school/work, and home connections before treating this as a production access policy.
