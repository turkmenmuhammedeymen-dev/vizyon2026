# AETHRION API Versioning

This is the intended policy for a public API; versions and endpoints must be verified against the deployed service before developers rely on them.

- Publish supported versions and request/response schemas.
- Avoid silently changing field semantics.
- Introduce breaking changes through a new version or migration window.
- Publish deprecation dates, migration examples and changelog.
- Document auth, quotas, errors, retention and rollback.

Legacy names such as `createV27ApiKey` may remain for compatibility; a function name does not define a public REST version or guarantee availability.
