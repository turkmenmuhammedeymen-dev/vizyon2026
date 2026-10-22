# AETHRION VPN / Proxy Protection

The server-side reputation endpoint is `/api/security-check`. It checks the visitor IP through IPQualityScore and flags VPN, proxy, and Tor indicators. The provider key is server-only and must never be added to HTML or JavaScript.

## Activate in Vercel

1. Open the Vercel project connected to this repository.
2. Go to **Settings → Environment Variables**.
3. Add `IPQS_API_KEY` with the API key from the IPQualityScore account.
4. Enable it for Production (and Preview if desired).
5. Redeploy the latest commit.
6. Test with a normal connection and a known VPN connection.

Until `IPQS_API_KEY` is configured, the endpoint reports `VPN_CHECK_NOT_CONFIGURED`; it does not claim protection is active. Once configured, the endpoint fails closed if the reputation provider cannot verify the request.

## Important limitation

The current static-site integration can prevent normal interaction in the browser after the check reports a block. It is not a substitute for an edge/WAF rule that rejects the HTTP request before HTML is served, and it cannot stop direct requests to third-party APIs such as Parse. For strict server-level enforcement, apply the same reputation policy at a supported edge firewall and protect backend endpoints independently.

VPN/proxy databases can produce false positives. Test the policy before treating it as an access-control rule for paying customers.
