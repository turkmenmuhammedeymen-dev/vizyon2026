# AETHRION Feature Menu — Role Access Matrix

Intended policy for implementation/testing; not proof that every current Cloud Code function already enforces it.

| Area | Guest | User | Moderator | Admin | Founder |
|---|---|---|---|---|---|
| Public pages/policies | Yes | Yes | Yes | Yes | Yes |
| Standard AI chat | No | Yes | Yes | Yes | Yes |
| JARVIS conversation | No | Yes | Yes | Yes | Yes |
| Own account/projects | No | Yes | Yes | Yes | Yes |
| Team tools | No | Membership-based | Membership-based | Membership-based | Yes |
| Moderation queue/reports | No | No | Yes | Yes | Yes |
| User suspension/ban | No | No | Scoped grant only | Yes | Yes |
| Role assignment/admin management | No | No | No | Explicit grants | Yes |
| System configuration/kill switch | No | No | No | Explicit grants | Yes |
| Sensitive security logs | No | No | Minimal scoped view | Scoped view | Restricted full view |
| API keys | No | Own keys | Own keys | Policy-defined | Policy-defined |

Rules:
1. Use the app's canonical role field and server-side checks; never trust a browser-supplied role.
2. Build menus from one role-aware feature registry to avoid inconsistent buttons.
3. Hide/disable unauthorized controls in the UI, but reject direct unauthorized Cloud Code calls too.
4. Do not give moderators all admin tools. Scope and audit moderator actions.
5. Test all roles, including direct privileged-function calls as an ordinary user.
6. Keep founder-only actions out of ordinary navigation.
7. Do not claim the fix is complete until live tests prove ordinary accounts cannot execute privileged operations.
