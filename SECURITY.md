# AETHRION Security Policy

Report vulnerabilities privately to **aethrion.official@gmail.com** with subject `Security report — AETHRION`. Include affected URL/component, reproduction steps and impact; never include passwords, live API keys, session tokens or unnecessary personal data. Please avoid public disclosure until there has been a reasonable opportunity to assess the issue. No bounty or fixed response time is promised.

Potential scope: authentication/authorization flaws, secret exposure, XSS/injection, API-key lifecycle and Cloud Code access-control failures. Do not perform destructive tests, denial of service, social engineering, data exfiltration or tests against systems you do not own or have permission to test. Stop if real user data is encountered.

The eight-layer framework in [SECURITY-OVERVIEW.md](SECURITY-OVERVIEW.md) and [security.html](https://vizyon2026.vercel.app/security.html) is a checklist, not proof every control is enabled or an independent audit. If a secret is exposed, revoke/rotate it and follow [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md).
