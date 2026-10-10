# Zira Group Inc

Work only on this repository and the isolated Zira deployment in `/opt/zira-group-inc`.
Use strict TypeScript, static Astro and Tailwind. Keep dependencies exact and commit the lockfile.
The approved V1 design belongs to a later phase. This V0 uses only the supplied brand, services and locations.
Never invent contact information, licenses, credentials, testimonials or project photographs.
Never change TeamFHO, Domino, databases, global server settings, Cloudflare services or DNS.
Never print secrets or commit private keys. CI requires a dedicated SSH key and verified known_hosts.
Use only the `zira-group-inc` Compose project, `zira-web` container and `127.0.0.1:38081` binding.
Validate with `npm ci`, `npm run check`, `npm test`, `npm run build` in web, then Docker build and Compose validation.
Do not deploy if validation fails. Use full commit SHA image tags; never rely on latest.
Report observed results honestly, including external blockers. Commits, push and the first controlled deployment are authorized by ZIRA-INFRA-02 after local checks pass.
