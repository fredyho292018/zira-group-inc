# ZIRA-INFRA-02 execution report

Date: 2026-10-10 (America/Chicago). Initial checkpoint before GitHub CI and first deployment. This report will be updated with observed external results.

```text
BASE_SHA=97cff2e01d8ed2b86a04cffda4376345eba15471
FINAL_SHA=PENDING_COMMIT
BRANCH=main
SSH_ACCESS=PASS (192.168.1.147; known host key verified)
PROJECT_STRUCTURE=PASS
ASTRO_BUILD=PASS
DOCKER_BUILD=PASS
DOCKER_HEALTH=PASS (local)
LOCAL_HTTP=PASS (workstation); PRODUCTION_PENDING
GHCR_PUBLISH=PENDING
GITHUB_CI=PENDING; LOCAL_ACTIONLINT=PASS
GITHUB_CD=BLOCKED (disabled; dedicated runner/key missing)
PRODUCTION_DEPLOY=PENDING
CLOUDFLARE_TUNNEL=SERVICE_ACTIVE; DASHBOARD_ROUTE_VERIFICATION_PENDING
ROOT_DOMAIN_HTTPS=FAIL (HTTP 525 before deployment)
WWW_DOMAIN_HTTPS=FAIL (HTTP 502 before deployment)
EXISTING_SERVICES_PRESERVED=READ_ONLY_AUDIT_PASS; POST_DEPLOY_PENDING
ROLLBACK_READY=IMPLEMENTED; NOT_EXERCISED
BLOCKERS=Dedicated CI SSH key and LAN runner unavailable; public routing pending
NEXT=Commit/push validated files, wait for GitHub CI/GHCR, attempt controlled first deployment
```

## Destination correction and production inventory

The original `.151` destination was `dominoserver` (Ubuntu 26.04.1), not teamfho-server. Only read-only checks were executed there. The user corrected the address and key to `192.168.1.147` / `teamfho_server_ed25519`.

Correct destination: `teamfho-server`, Ubuntu 24.04.4 LTS, deploy UID 1000 with Docker group membership, Docker 29.7.2, Compose 5.5.0. Root disk approximately 50 GB available. Memory approximately 3611 MB available; 4095 MB swap unused. Port 38081 had no listener. GHCR `/v2/` returned expected authentication challenge 401 (connectivity only, not package authorization). `/opt/zira-group-inc` did not exist. `cloudflared` and `cloudflared-zira` were loaded/active/running. No Cloudflare tokens or private-key content were read or printed.

| Existing container | Image | Initial state / binding |
| --- | --- | --- |
| cuban-domino-club-web-1 | caddy:2-alpine | healthy; 127.0.0.1:38080 → 80 |
| teamfho-test-web-1 | ghcr.io/fredyho292018/teamfho-web:3596ec1a157d6398987e4f3bca30e7e0878a4209 | healthy; 127.0.0.1:18080 → 8080 |
| teamfho-test-api-1 | ghcr.io/fredyho292018/teamfho-api:3596ec1a157d6398987e4f3bca30e7e0878a4209 | healthy; 127.0.0.1:18081 → 8080 |
| teamfho-prod-web-1 | teamfho-web:seo-g1-1ecc76a6a61dcd7c65425667f28ea97cbf0a0f0b | healthy; 127.0.0.1:28080 → 8080 |
| teamfho-prod-api-1 | ghcr.io/fredyho292018/teamfho-api:a67f822508e8aa80915fa4065d404083e8f4abec | healthy; 127.0.0.1:28081 → 8080 |
| teamfho-prod-pgadmin-prod-1 | dpage/pgadmin4:9.17 | healthy; 127.0.0.1:5050 → 80 |
| teamfho-test-pgadmin-test-1 | dpage/pgadmin4:9.17 | healthy; 127.0.0.1:5051 → 80 |
| teamfho-prod-postgres-1 | postgres:17-alpine | healthy; internal 5432 |
| teamfho-test-postgres-1 | postgres:17-alpine | healthy; internal 5432 |

Initial HTTP: TeamFHO production 28080=200; test 18080=200; Domino 38080=200. Inventory will be compared after deployment.

## Local validation and decisions

- Node 22.23.2 / npm 10.9.8 / Git 2.47.0 / Docker Desktop 28.0.4 / Compose 2.34.0.
- `npm ci` succeeded; Astro check: 7 files, zero errors/warnings/hints; 3 tests passed; build generated index and sitemap; infrastructure YAML/invariants passed.
- Astro 7.3.8, Tailwind 4.3.3, TypeScript 6.0.3. The initial TypeScript 7 proposal failed peer resolution; corrected without bypassing dependency checks.
- Docker multi-stage build passed. Runtime user 10001:10001, health `healthy`, loopback-only 38081. Caddy configuration valid; www Host header returned 301 to `https://ziragroupinc.com/`.
- Initial runtime test caught Caddy binary file capabilities conflicting with dropped container capabilities. Removing that binary capability in the image restored nonroot execution without expanding privileges.
- ShellCheck 0.10.0 and Actionlint 1.7.7 passed. The custom self-hosted label is explicitly declared in `.github/actionlint.yaml`. These local checks do not substitute for GitHub execution.
- Browser verified at 1280×900 and 390×844; DOM content width equals viewport content width, one h1, no forms; Contact navigation reaches the intended anchor. Viewport override reset.
- GitHub repository is public and administrative API access available. Production Environment created with required reviewer `fredyho292018`, administrator bypass disabled, main-only branch policy. CD variable false. Corrected host variables set. No runners registered; dedicated SSH secrets not set. Existing Git authentication was used only in memory for API calls; no credentials were stored in tracked files.
- V0 includes only supplied services/locations, simple navy/white/gold branding and explicit unavailable contact details. No V1 redesign, fake contacts, real-project photographs, certificates or testimonials.
- Base image digests and Action commit SHAs verified and pinned. No latest deployment tag. Caddy serves genuine 404s for nonexistent static paths.
- Cloudflare services/DNS/mail records and existing databases remain untouched. Protected credentials must be provisioned by a human before enabling CD. See `infra/PRODUCTION.md` for exact intended DNS names and the need to verify the tunnel UUID and hidden inherited records in the dashboard.

## File inventory

`AGENTS.md`, `README.md`, `.gitignore`, `.gitattributes`, `.dockerignore`; `web/package.json`, `web/package-lock.json`, `web/tsconfig.json`, `web/astro.config.mjs`, `web/.env.example`; `web/src/components/{Header,Services,Footer}.astro`, `web/src/layouts/BaseLayout.astro`, `web/src/pages/index.astro`, `web/src/styles/global.css`; `web/public/{favicon.svg,robots.txt,health.txt}`; `infra/{Dockerfile,Caddyfile,compose.yaml,deploy.sh,rollback.sh,PRODUCTION.md}`; `.github/workflows/{ci,deploy}.yml`, `.github/actionlint.yaml`; `Validation/{site.test.mjs,validate-infra.mjs,ZIRA_INFRA_02_REPORT.md}`.

Ignored local tooling, node_modules, build outputs and credential-free API helper scripts are not part of the delivery.
