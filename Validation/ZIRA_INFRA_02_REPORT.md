# ZIRA-INFRA-02 execution report

Date: 2026-10-10 (America/Chicago). Final infrastructure/deployment checkpoint. Overall result is BLOCKED for public routing and automated CD, with a successful controlled production deployment.

```text
BASE_SHA=97cff2e01d8ed2b86a04cffda4376345eba15471
FINAL_SHA=368299e1565e26529f1634574b66e2d07c15b7c6 (final validated implementation/deployed release; documentation-only report commit is separate)
BRANCH=main
SSH_ACCESS=PASS (192.168.1.147; known host key verified)
PROJECT_STRUCTURE=PASS
ASTRO_BUILD=PASS
DOCKER_BUILD=PASS
DOCKER_HEALTH=PASS (workstation and production)
LOCAL_HTTP=PASS (workstation and production; production 200)
GHCR_PUBLISH=PASS (SHA tag published by successful GitHub CI; server pull succeeded)
GITHUB_CI=PASS (38080462995); LOCAL_ACTIONLINT=PASS
GITHUB_CD=BLOCKED (disabled; dedicated runner/key missing; workflow 38080572484 skipped)
PRODUCTION_DEPLOY=PASS (controlled manual initial deployment, not automated CD)
CLOUDFLARE_TUNNEL=SERVICE_ACTIVE; UUID_VERIFIED; ROOT_INGRESS_HOSTNAME_DUPLICATED
ROOT_DOMAIN_HTTPS=FAIL (HTTP 525 after deployment)
WWW_DOMAIN_HTTPS=FAIL_END_TO_END (current Cloudflare edge returns 301; cached route TLS fails; root destination fails)
EXISTING_SERVICES_PRESERVED=PASS (all 9 IDs/images unchanged, healthy; existing web HTTP 200)
ROLLBACK_READY=PREPARED_NOT_EXERCISED; NO_PREVIOUS_RELEASE_ON_FIRST_DEPLOY
BLOCKERS=Dedicated CI SSH key and LAN runner unavailable; duplicated root ingress; DNS dashboard verification/correction and propagation
NEXT=Authorize precise Cloudflare/DNS correction separately; provision dedicated CD key and LAN runner; verify HTTPS before enabling CD
ZIRA_INFRA_02=BLOCKED_PARTIAL_SUCCESS
WEBSITE_V0=DEPLOYED_LOCAL_PRODUCTION_ORIGIN
PUBLIC_PASS=NO
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

Initial and post-deployment HTTP: TeamFHO production 28080=200; test 18080=200; Domino 38080=200. All nine existing container IDs and images stayed identical and all remained healthy. Their IDs, in the same row order above: `6c38cee3611c`, `043c3d149858`, `e2dd5ec6de4f`, `cdb0f0b38cad`, `46cf2ad8b5b1`, `45963ac77901`, `4de147dda9f4`, `f321b5469e8e`, `069a071399f4`.

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

## External checkpoint

Implementation commit `368299e1565e26529f1634574b66e2d07c15b7c6` committed/pushed to main after local checks passed. [GitHub CI run](https://github.com/fredyho292018/zira-group-inc/actions/runs/38080462995): validation and registry publication jobs completed successfully, including real Linux Docker build/runtime smoke checks. [CD run](https://github.com/fredyho292018/zira-group-inc/actions/runs/38080572484) was deliberately skipped by the disabled gate; this is not CD PASS.

Filtered cloudflared-zira events identify tunnel UUID `a8662c8d-37b2-454b-bc92-b7458144bf7f`; latest ingress contains `ziragroupinc.com.ziragroupinc.com` (incorrect) and `www.ziragroupinc.com` (correct), both using `http://localhost:38081`, plus catchall 404. Correcting the duplicated hostname is outside current authorization.

Workstation resolver cache returned root A values `207.207.210.23`, `207.207.210.36`, `207.207.210.50` and effective www CNAME `uixie.porkbun.com`. Public resolver 1.1.1.1 subsequently returned Cloudflare edges `104.21.63.42` and `172.67.143.17` for both hostnames, with Cloudflare NS `bart.ns.cloudflare.com` and `laura.ns.cloudflare.com`. This distinction corrects the initial interpretation of local cached answers as current public DNS. Origin DNS values behind the proxy still require dashboard inspection.

Proposed target for separately authorized dashboard correction: CNAME `@` and exact `www` → `a8662c8d-37b2-454b-bc92-b7458144bf7f.cfargotunnel.com`, proxied. Correct ingress from `ziragroupinc.com.ziragroupinc.com` to `ziragroupinc.com`. Only replace the three inherited A records if the dashboard confirms them; inspect exact www versus wildcard before changing it. Preserve wildcard consumers and all mail records. No DNS or ingress changes executed.

## Controlled first deployment and final verification

After CI/publication success, deploy's existing Docker authentication successfully pulled the exact image. No credentials or package visibility changes were needed. Registry digest: `sha256:7acd40cc30b02120b362aaba1f842f33c2489fde31f2db52cfa937bd91b6abc9`.

Created only `/opt/zira-group-inc` (deploy ownership, mode 0750), uploaded the three deployment files and ran deploy.sh for the full SHA. New container ID `b7eb0aa531e7`, project/network `zira-group-inc`, only binding `127.0.0.1:38081:80`. Health healthy, runtime user `10001:10001`, read-only root, all capabilities dropped, 128 MiB limit, 0.5 CPU. HTTP root 200 with expected Zira content; `/health.txt` returned `zira-ok`. Local canonical www redirect 301 passed. Both cloudflared services remained active; no service restart was performed.

Root HTTPS returned 525 from Windows and Linux after deployment. Default cached www resolution failed TLS with both Schannel and OpenSSL. Explicitly resolving www to the current Cloudflare edge `104.21.63.42` produced real HTTPS 301 with certificate verification enabled. This validates current edge routing only; canonical root remains unavailable, so www is not end-to-end PASS. No insecure TLS option was used.

Rollback code and shell validation are ready, but there is no `.previous.env` on a first release and rollback against a previous successful production image has not been exercised. Do not claim a rollback test passed. Do not remove a healthy origin to compensate for a DNS/TLS routing issue.

Only the implementation release SHA is embedded above: a tracked report cannot embed its own eventual commit hash. Resolve the documentation revision with `git log -1 --format=%H -- Validation/ZIRA_INFRA_02_REPORT.md`; it does not change the deployed application. Final chat records the repository HEAD after the documentation commit.
