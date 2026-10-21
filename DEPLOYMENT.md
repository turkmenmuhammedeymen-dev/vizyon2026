# AETHRION Deployment — GitHub + Vercel

Current assumptions: static files in repository root, Vercel connected to GitHub, no `public/` folder, known production URL `https://vizyon2026.vercel.app/`. Do not change canonical URLs until a new domain is configured.

1. Work in a feature branch and review the diff.
2. Run available HTML/JS/CSS checks and inspect for broken links/secrets.
3. Use a Vercel preview deployment where possible.
4. Test mobile layout, keyboard focus, authentication, permissions, Cloud Code, provider errors, uploads and microphone access.
5. Merge only after review and verify deployment.
6. Check `/favicon.svg`, `/aethrion-brand.css`, `/robots.txt`, `/sitemap.xml`, `/security.html`, `/.well-known/security.txt`.
7. Inspect the live URL in Google Search Console; indexing is not immediate.

Keep provider/master keys in server-side secret storage, never public browser variables. Rotate exposed secrets. If core authentication or protected API calls break, roll back to a known-good deployment and investigate with sanitized logs.
