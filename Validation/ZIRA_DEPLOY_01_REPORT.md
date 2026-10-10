# ZIRA-DEPLOY-01 — Production deployment

Deployment checkpoint in progress, 2026-10-10. No PASS is claimed until CI, registry, production and public verification finish.

BASE_SHA=df866b8517dcdce2802341c418a419980268e30b
DEPLOYED_SHA=PENDING
GIT_STATUS=Approved Zira-only visual/contact changes; no secret patterns detected
GITHUB_PUSH=PENDING
CI_STATUS=PENDING
GHCR_IMAGE=PENDING
DOCKER_CONTAINER=zira-web
DOCKER_HEALTH=PRE_DEPLOY_HEALTHY
LOCAL_HTTP=PRE_DEPLOY_200
ROOT_HTTPS=PRE_DEPLOY_200
WWW_HTTPS=PRE_DEPLOY_TLS_HANDSHAKE_FAILURE
VISUAL_VALIDATION=LOCAL_PASS_FOUR_VIEWPORTS
CONTACT_FORM_DEMO=LOCAL_PASS_EDITABLE_VALIDATING_NO_TRANSMISSION
EMAIL_SENT=NO
PERSONAL_DATA_STORED=NO
TEAMFHO_PRESERVED=PRE_DEPLOY_HEALTHY
DOMINO_PRESERVED=PRE_DEPLOY_HEALTHY
ROLLBACK_STATUS=Previous release 368299e1565e26529f1634574b66e2d07c15b7c6 recorded; deployment script preserves previous reference
BLOCKERS=Server address clarification pending; WWW TLS failure under current resolver
NEXT=Confirm teamfho-server destination, finish CI/publication and deploy only the Zira service

## Audit and scope

The supplied .151 address identifies dominoserver. Existing Zira deployment and teamfho-server are at .147, previously explicitly corrected by the user. Only read-only checks were performed on .151; confirmation is pending before production mutation.

On .147: 50 GB free; Zira healthy; all nine TeamFHO/Domino containers healthy and unchanged since the earlier baseline; both cloudflared and cloudflared-zira services active. Origin HTTP: Zira 38081, TeamFHO 28080/18080, Domino 38080 all 200. Deployment files match local SHA256 hashes. Only the matching ZIRA_IMAGE line was inspected from the release environment; credentials were not read or printed.

Local npm ci, Astro check (15 files, no errors/warnings/hints), 28 tests, Astro build, strict Worker type check, Docker build and Compose config passed. Initial npm ci file-lock error resolved by closing the local preview. No existing production service was stopped. No infra, CI, DNS, Tunnel or database changes.

Demo mode validates six editable fields, shows field errors and the exact message “Demo mode — Your information has not been sent.” Button type=button; submit events are prevented. Demo branch exits before API/Turnstile setup. No message or personal data is stored or logged. Consent remains unavailable until a real privacy policy and delivery integration are authorized. Prepared Worker code remains undeployed and inactive.

Validated widths: 1440×900, 768×1024, 393×852 and 430×932; no horizontal overflow, required sections present, no broken loaded images. Browser confirmed six errors and focus on fullName for empty input; valid fictional details produce IDLE with the demo message, never SUCCESS.
