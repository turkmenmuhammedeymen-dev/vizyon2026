# AETHRION Security Review — Open Items

**Review type:** static source inspection of the repository branch. This is not a penetration test, backend audit or confirmation of production configuration.

## High-priority verification: first-install admin initialization

The client-side `index.html` contains a first-install path that calls the Cloud Code function `initAdminUsers` and passes a `useMasterKey` option from browser-side code. The browser must never receive or control a database master key. Client-supplied flags are not a security boundary; privileged work must be authorized and executed inside Cloud Code.

**Required before production merge:** inspect the deployed Cloud Code source for `initAdminUsers` and confirm that it:
- can only run for an explicitly authorized administrator or a securely controlled one-time setup process;
- cannot be triggered by an arbitrary signed-in or anonymous user to create/promote privileged accounts;
- validates server-side state and cannot trust client-supplied role/owner fields;
- uses privileged database access only inside the trusted server runtime;
- is disabled or safely idempotent after initialization.

The backend Cloud Code source was not present in this repository root during this review, so the function's actual authorization cannot be confirmed here. Do not infer that the call is exploitable without inspecting the server implementation, but treat it as a high-priority review item.

## API key management

The browser calls `getUserApiKeyValue` to retrieve a stored user API key. Verify that the Cloud Code function checks the authenticated user's ownership of the requested key, never returns another user's secret, applies rate limits where appropriate, and logs no plaintext secret. Confirm revocation and rotation behavior too.

## Evidence and limitations

- The static page references `Parse.Query(Parse.User).count({ useMasterKey: true })` and `Parse.Cloud.run('initAdminUsers', {}, { useMasterKey: true })` in a first-install flow. Passing an option from the browser does not grant the browser a master key; privileged authority must be enforced on the server.
- This repository contains the web frontend but not the deployed Cloud Code source needed to validate the server-side guards.
- Review the backend, Parse class-level permissions, Cloud Code function permissions, API-key storage, and Vercel/Back4App secret settings before claiming the eight layers are fully implemented.

## Resolution checklist
- [ ] Inspect and test `initAdminUsers` in the deployed Cloud Code.
- [ ] Inspect `getUserApiKeyValue` ownership checks and key storage.
- [ ] Confirm all privileged operations reject unauthorized users server-side.
- [ ] Confirm no master key/provider secrets exist in the browser bundle or Git history.
- [ ] Record the result and regression tests before closing this item.
