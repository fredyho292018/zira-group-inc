# Zira Group Inc

Provisional V0 website for construction and remodeling services in South Florida. The approved V1 visual design remains a later phase. Navy, white and gold branding; no invented contact details or nonfunctional forms.

## Local development

Use Node.js 22.23.2 and npm 10.9.8. All direct dependencies are exact and transitive versions are locked.

```sh
cd web
npm ci
npm run dev
```

Open `http://127.0.0.1:4321`. Validate with `npm run check`, `npm test`, `npm run build`, `npm run validate:infra`. Preview the static build with `npm run preview`. The canonical site URL is fixed in `astro.config.mjs`; public environment variables must never contain secrets.

## Docker

From the repository root:

```sh
docker build -f infra/Dockerfile -t zira-web:validation .
ZIRA_IMAGE=zira-web:validation docker compose -f infra/compose.yaml config --quiet
ZIRA_IMAGE=zira-web:validation docker compose -f infra/compose.yaml up -d --wait --wait-timeout 90
curl --fail http://127.0.0.1:38081/health.txt
```

In PowerShell, set `$env:ZIRA_IMAGE='zira-web:validation'` before Compose. Production uses a full SHA GHCR image. The static runtime uses Caddy, user 10001, a read-only filesystem, dropped capabilities, an isolated network and resource limits. Only host loopback port 38081 is published. Its nonroot port binding uses a container-local sysctl; no host settings change.

## CI and deployment

`ci.yml` validates installation, Astro, tests, build, infrastructure, shell scripts and Docker runtime on pull requests/main. Successful main runs publish a SHA image to GHCR with the built-in GitHub token. Actions and Docker base images are pinned by SHA/digest.

`deploy.yml` requires successful main CI, repository variable `ZIRA_CD_ENABLED=true`, a dedicated LAN runner and approval through the production Environment. It verifies the known SSH host, deploys only Zira, checks health/HTTP and public HTTPS, and removes temporary credentials. CD remains disabled pending dedicated credentials and the runner. The authorized initial deployment may be executed manually after real CI/publication succeeds.

See [production runbook](infra/PRODUCTION.md) for secrets, initial deployment, rollback and Cloudflare routing. See [validation report](Validation/ZIRA_INFRA_02_REPORT.md) for actual results and blockers.

## Structure

- `web/`: strict TypeScript Astro application, components, layout, Tailwind styles and public resources.
- `infra/`: multi-stage image, Caddy, isolated Compose and deployment/rollback scripts.
- `.github/`: pinned workflows and validator configuration.
- `Validation/`: tests, isolation validator and the execution report.

Never change TeamFHO, Cuban Domino Club, their databases, global Docker settings, Cloudflare services or DNS as part of a Zira deployment.
