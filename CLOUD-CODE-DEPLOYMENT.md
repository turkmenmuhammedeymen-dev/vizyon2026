# Back4App Cloud Code Deployment

## Required secret
- Source: [back4app/main.js](./back4app/main.js)
- Required private runtime environment variable: `IPQS_API_KEY`
- Never commit the key or put it in browser JavaScript or client-readable Parse Config.

## Deployment sequence
1. Configure `IPQS_API_KEY` in Back4App's server-side Cloud Code Environment Variables.
2. Upload `back4app/main.js` as the app's Cloud Code `main.js`.
3. Deploy Cloud Code and inspect startup logs for syntax or initialization errors.
4. Verify the public `aethrionSecurityCheck` function returns a structured result without accepting a caller-supplied IP.
5. Test a normal connection, a known VPN/proxy/Tor connection, provider timeout, missing key, registration/login, AI chat, translation, file analysis, and API-key workflows.

## Security behavior
The Cloud Code gate fails closed if the provider key, trusted client IP, or reputation result is unavailable. The browser calls `aethrionSecurityCheck` through the existing Parse SDK. That one function is excluded from the generic wrapper only so it can return a structured result; it performs its own IPQS check. All other externally invoked Cloud Functions remain gated. Trusted master-key internal calls bypass the outer gate to avoid repeating checks during internal orchestration. Never expose a master key in the browser.

## Verification limits
GitHub Actions syntax checks do not prove the Back4App runtime and provider account work live. Verify the runtime environment variable is actually readable and test the full application before production. IPQS cannot guarantee detection of every VPN/proxy. Review privacy/KVKK disclosures against actual processing, retention, legal basis, and cross-border-transfer requirements.
