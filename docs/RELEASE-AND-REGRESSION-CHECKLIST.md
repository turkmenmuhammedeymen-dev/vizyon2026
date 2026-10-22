# AETHRION Release and Regression Checklist

## Before merge
- [ ] Inspect the complete current index.html; never overwrite it with an older Library copy.
- [ ] Review feature menu against ROLE-ACCESS-MATRIX.md.
- [ ] Verify all policy links resolve.
- [ ] Confirm no API key, token or private configuration is in source code or logs.
- [ ] Run HTML validation and JavaScript syntax checks.
- [ ] Test mobile layout, keyboard access and reduced motion.
- [ ] Test voice unsupported, permission denied, empty input, provider error, rate limit and success.
- [ ] Test guest, user, moderator, admin and founder roles.
- [ ] Test direct calls to privileged Cloud Code functions as an ordinary user.
- [ ] Confirm JARVIS asks before external/irreversible actions.
- [ ] Review privacy, AI use, third-party services and retention against actual configuration.

## Deployment
- [ ] Create a Vercel Preview from the intended commit.
- [ ] Test login/register, AI, voice, quotas, file analysis, account controls and navigation.
- [ ] Deploy Back4App Cloud Code separately after backend changes.
- [ ] Confirm production deployment SHA matches the reviewed commit.
- [ ] Promote only after critical checks pass.

## Known limitations
- The GitHub connector returned an empty content field for the current index.html while providing a blob SHA. Do not replace that large file blindly; retrieve the complete current source before editing it.
- This frontend voice surface uses the existing chat function. Computer control, live screen streaming, real web/tool execution, persistent project memory and advanced orchestration require further backend/provider integration.
- A policy document is not proof of implementation or legal compliance. Verify the actual provider configuration and responsible-operator/contact details.
