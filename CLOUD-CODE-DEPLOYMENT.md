# Back4App Cloud Code Deployment

## Required secret
- Source: [back4app/main.js](./back4app/main.js)
- Required private runtime secret: `IPQS_API_KEY`
- The website separately requires `IPQS_API_KEY` in Vercel Project Settings -> Environment Variables.

Set the same IPQualityScore key in both runtimes. Do not put it into source code, HTML, client-side JavaScript, a public repository, or a client-readable Parse Config.

## Deployment sequence
1. Copy/download `back4app/main.js` as the app's Cloud Code `main.js`.
2. Set `IPQS_API_KEY` in the Back4App server-side Cloud Code environment using the secret/environment-variable mechanism supported by that runtime.
3. Deploy Cloud Code and inspect startup logs for syntax or initialization errors.
4. Verify trusted master-key internal `Parse.Cloud.run` calls, then test a normal non-VPN request.
5. Configure `IPQS_API_KEY` in Vercel Production, then merge/deploy the website branch.
6. Test ordinary connection, known VPN/proxy/Tor, provider timeout, missing key, registration/login, AI chat, translation, file analysis, and API-key workflows.

## Security behavior
The Cloud Code gate fails closed if IP reputation cannot be checked. Trusted master-key internal calls bypass the outer gate to avoid repeating the check during internal orchestration. Never expose a master key in the browser.

## Verification limits
GitHub Actions runs syntax checks, but the Back4App runtime and provider account must be tested live. IPQS does not guarantee every VPN/proxy is detected. Privacy and KVKK disclosures were updated to describe intended processing; review the actual legal basis, retention, controller/contact details and cross-border-transfer obligations before production.
