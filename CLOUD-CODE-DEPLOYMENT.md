# Back4App Cloud Code Deployment

## Deployment sequence
1. Open the AETHRION application in Back4App.
2. Upload `back4app/main.js` as Cloud Code `main.js`.
3. Deploy Cloud Code and inspect startup logs for syntax or initialization errors.
4. Verify email/password registration and login, verification email delivery, Google/Facebook sign-in, AI chat, translation, file analysis and API-key workflows.
5. Confirm server-side role checks, rate limits and feature permissions remain active.

## Credential handling
Keep production API credentials in private server-side environment variables. Never commit secret values, put them in browser JavaScript, or store them in client-readable configuration. Never expose a master key in the browser.

## Verification limits
GitHub Actions syntax checks do not prove the Back4App runtime, authentication providers or external API credentials work live. Verify the runtime configuration and test the full application before production. Review privacy/KVKK disclosures against actual processing, retention, legal basis and cross-border-transfer requirements.
