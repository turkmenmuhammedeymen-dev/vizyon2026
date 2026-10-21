# AETHRION API and Integration Guide

The website uses Parse/Back4App Cloud Code where configured. AI features may use external provider APIs or local Ollama depending on deployment. This guide intentionally does not invent public REST endpoints or schemas not verified in the deployed backend.

## Compatibility-sensitive Cloud Code names
Do not rename without locating all callers and deploying matching backend changes: `vizyonAlChat`, `vizyonAlScreenRead`, `vizyonAlLiveScreenStream`, `vizyonAlFileAnalyze`, `kocChat`, `getKocHistory`, `shareKocConversation`, `createV27ApiKey`, `createVideoClip`, `generate3DWithHF`, `sendFounderMessage`, `smartTranslate`.

Legacy DOM/CSS hooks may include `vizyonAlPanel`, `kocPanelOverlay`, `moderatorVideoToolModal`, `v27KeyRevealOverlay`, `vz-*`, `koc-*`, `vizyon-al-*`. Names do not guarantee every function is deployed or enabled.

Known Parse call shape:
```js
const result = await Parse.Cloud.run("vizyonAlChat", { message: userMessage, mode: "normal" });
```
Confirm parameters and responses in deployed Cloud Code. Never put provider secrets or master keys in client code.

## Public A27 API
The actual base URL, key format, scopes, quotas and schemas must be confirmed from production before publishing external examples. Document authentication, schemas, errors, quotas, retention and deprecation policy before public release. See [API-VERSIONING.md](API-VERSIONING.md).
