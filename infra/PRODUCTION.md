# Production runbook

## Identity and isolation

The verified destination is `deploy@192.168.1.147:22` (`teamfho-server`), corrected by the user during ZIRA-INFRA-02. The original `.151` destination was a different host and received read-only checks only.
Manual SSH uses the existing `teamfho_server_ed25519` key with strict known-host verification. Never copy that personal key into GitHub.
Only `/opt/zira-group-inc`, the `zira-group-inc` network/project and `zira-web` belong to this deployment.

## GitHub production prerequisites

The production Environment requires review by `fredyho292018`, is limited to `main`, and disables administrator bypass. Repository variable `ZIRA_CD_ENABLED=false` deliberately blocks CD until prerequisites are verified.

1. Register a dedicated Linux x64 runner with LAN access and label `zira-production`. Do not reuse or alter a TeamFHO runner or install a runner as a global server change without additional authorization. Never run pull-request jobs on this runner.
2. Create a dedicated Zira SSH key outside the repository. A human must install its public key for the deployment account and enter the private key into the production Environment secret `ZIRA_SSH_PRIVATE_KEY`. Use a deployment account with the minimum Docker and Zira-directory permissions available; Docker group access is effectively privileged and should not be expanded casually.
3. Set production secret `ZIRA_SSH_KNOWN_HOSTS` to the independently verified known-host entry for `192.168.1.147`. Do not trust a freshly collected ssh-keyscan result without comparing its fingerprint with a trusted record.
4. Production variables: `ZIRA_SSH_HOST=192.168.1.147`, `ZIRA_SSH_USER=deploy`, `ZIRA_SSH_PORT=22`.
5. Verify that the deployment user can pull the SHA-tagged GHCR image. If private-package authorization fails, stop. A human must grant package read access using a dedicated credential and authenticate via `docker login ghcr.io --username ACCOUNT --password-stdin`; never put tokens in arguments, tracked files or reports. Preserve package visibility.
6. Confirm both public hostnames route to Zira, then set repository variable `ZIRA_CD_ENABLED=true`. A subsequent successful main CI run starts an Environment-protected deployment.

Hosted CI publishes `ghcr.io/fredyho292018/zira-group-inc:FULL_COMMIT_SHA` only after validation succeeds. Deployment uses that exact SHA, not latest. Version aliases may be added for an explicitly approved release; V0 has no version alias.

## Controlled initial deployment

After the matching GitHub CI and registry publication pass, create `/opt/zira-group-inc` owned by deploy (only this new Zira directory), upload `compose.yaml`, `deploy.sh`, `rollback.sh`, then run:

```sh
cd /opt/zira-group-inc
bash deploy.sh ghcr.io/fredyho292018/zira-group-inc:FULL_COMMIT_SHA
docker inspect --format '{{.State.Health.Status}}' zira-web
curl --fail http://127.0.0.1:38081/health.txt
```

The script serializes deployments, checks ownership of an existing container name, waits for Docker health, checks real HTTP and records `.env` only after success. `.previous.env` holds the previous successful image after the second successful release. A failed initial rollout removes only the failed Zira container; there is no previous release to restore. Downloads fail before any running container changes. A health/HTTP failure after a replacement triggers automatic rollback, and rollback failure exits with an explicit error.

Manual rollback: `bash /opt/zira-group-inc/rollback.sh`. This reuses the deployment checks and lock. Rollback is prepared but is not declared exercised until tested against a prior successful release. Public DNS/TLS failures are reported separately; a healthy local deployment does not repair DNS and is not removed merely because public routing is wrong.

## Cloudflare: read-only verification and proposed corrections

Do not modify or restart either cloudflared service. `cloudflared-zira` is active on the corrected host. The user identifies the tunnel as `zira-group-inc-prod` and origin as `http://localhost:38081`; the tunnel UUID and dashboard ingress entries must be independently verified without reading tokens.

In the Cloudflare dashboard, inspect the exact hostnames before changing anything. Intended public routes are:

| Hostname | Tunnel | Origin |
| --- | --- | --- |
| `ziragroupinc.com` | `zira-group-inc-prod` | `http://localhost:38081` |
| `www.ziragroupinc.com` | `zira-group-inc-prod` | `http://localhost:38081` |

The tunnel startup event identifies UUID `a8662c8d-37b2-454b-bc92-b7458144bf7f`. Its latest ingress configuration contains the erroneous hostname `ziragroupinc.com.ziragroupinc.com` and the correct hostname `www.ziragroupinc.com`, both pointing to `http://localhost:38081`. The startup/configuration events were filtered to UUID, hostnames and origins only; no tokens were accessed.

The proposed correction, requiring additional authorization, is to replace the duplicated root ingress hostname with exactly `ziragroupinc.com` and preserve the www ingress. The intended DNS target is `a8662c8d-37b2-454b-bc92-b7458144bf7f.cfargotunnel.com`, with Cloudflare proxy enabled. Use DNS name `@` for the root and `www` for www.

Observed workstation resolver cache on 2026-10-10: root A values `207.207.210.23`, `207.207.210.36`, `207.207.210.50`; www CNAME `uixie.porkbun.com`. A subsequent query to public resolver `1.1.1.1` returned Cloudflare edge A addresses `104.21.63.42` and `172.67.143.17` for both domains, with authoritative nameservers `bart.ns.cloudflare.com` and `laura.ns.cloudflare.com`. These differing answers indicate resolver propagation/cache differences; the public proxied records hide origin targets. Do not assume the cached Porkbun answers prove those records are still present in the dashboard.

After dashboard verification and additional authorization, if those three root web A records remain, replace only those records with the root tunnel CNAME. If www still uses Porkbun web routing, add/replace the exact www tunnel CNAME after inspecting whether the answer is wildcard-generated. Preserve mail records and other wildcard consumers. Do not invent an exact record to delete. Root HTTPS currently returns 525; www forced to the current Cloudflare edge returns 301, while cached Porkbun routing fails TLS. Neither hostname passes end-to-end access to the canonical site yet.

If the three inherited root A records still exist in the dashboard and route to Porkbun, propose replacing exactly those root web records with the tunnel CNAME after additional DNS authorization. Do not change the wildcard automatically: an exact www route takes precedence, and other wildcard consumers may depend on it. Do not touch MX, SPF, DKIM or DMARC. Public DNS with proxy enabled hides origin A/CNAME values; observed Cloudflare edge addresses do not prove which dashboard records exist. No exact tunnel target or inherited IP should be invented.

Verify real HTTPS without `--insecure`: root returns the Zira page; www returns 301 to the root and reaches that page when followed. Caddy preserves paths and query strings in the canonical redirect. Health URL is `/health.txt` with body `zira-ok`.
