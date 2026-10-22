# AETHRION — Intelligence Without Limits

AETHRION is a browser-based AI and productivity ecosystem deployed on Vercel from this GitHub repository.

## Main areas

- AI workspace and assistant interfaces
- Model catalogue and API documentation
- 3D Studio, code editor, video tools and learning resources
- Community, projects, account and security pages
- Turkish-first interface with responsive desktop and mobile layouts

## Deployment

The repository is connected to Vercel and uses the repository root as the static site root. There is no `public/` directory; HTML, CSS, JavaScript, SVG, JSON, and policy pages are stored at the repository root or under `api/`.

Changes pushed to `main` are expected to trigger a Vercel deployment. Always confirm the deployment status in Vercel before testing the live website.

## Security configuration

The API route `api/security-check.js` uses IPQualityScore for VPN/proxy/Tor reputation checks. Configure the secret `IPQS_API_KEY` in Vercel Project Settings → Environment Variables, then redeploy. Never commit the key to this repository.

Read [VPN-BLOCKING-SETUP.md](./VPN-BLOCKING-SETUP.md) for the current gate behavior and the distinction between browser-side blocking and true edge/firewall enforcement.

## Workspace maintenance

The authenticated workspace is consolidated around `aethrion-workspace-v5.js` and `aethrion-workspace-v6.js`, with corresponding CSS. The v6 layer owns the logged-in workspace shell; legacy feature drawers must not override it. Preserve legacy IDs and cloud-function names when changing integration code.

## Important

A successful GitHub commit confirms source changes only. It does not prove that Vercel has deployed the latest commit or that third-party AI, authentication, microphone, Back4App, and API services work end-to-end. Test those flows against the deployed environment.
