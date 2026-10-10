# ZIRA-DEPLOY-01 — Production deployment

Final production checkpoint, 2026-10-10. User confirmed deploy@192.168.1.147 as teamfho-server. The approved application was committed, pushed, validated by CI, published to GHCR and deployed exclusively to Zira.

ZIRA_DEPLOY_01=PASS
LIGHT_PREMIUM_V1=DEPLOYED
CONTACT_FORM_DEMO=DEPLOYED
EXISTING_SERVICES=UNCHANGED

BASE_SHA=df866b8517dcdce2802341c418a419980268e30b
DEPLOYED_SHA=54c786a55f6952cd3ccfa76bed85fbd75c6d51f1
CANDIDATE_SHA=54c786a55f6952cd3ccfa76bed85fbd75c6d51f1
GIT_STATUS=Application committed and pushed; final report/screenshots saved in a separate documentation checkpoint
GITHUB_PUSH=PASS — remote main matches candidate SHA
CI_STATUS=PASS — run 38085673344, validate=success, publish=success
GHCR_IMAGE=ghcr.io/fredyho292018/zira-group-inc:54c786a55f6952cd3ccfa76bed85fbd75c6d51f1 — pulled successfully; digest sha256:1d9f81886834b06779205576c00216a96b86185b7d5307b61d2b3e58a4ba4d63
DOCKER_CONTAINER=zira-web
DOCKER_HEALTH=HEALTHY
LOCAL_HTTP=PASS_200
ROOT_HTTPS=PASS_200_EXACT_NEW_CONTENT
WWW_HTTPS=PASS_200_FOLLOWING_CANONICAL_REDIRECT_WITH_NORMAL_RESOLUTION
VISUAL_VALIDATION=PASS_LOCAL_AND_PUBLIC_SITE
CONTACT_FORM_DEMO=PASS_EDITABLE_VALIDATING_NO_TRANSMISSION
EMAIL_SENT=NO
PERSONAL_DATA_STORED=NO
TEAMFHO_PRESERVED=PASS_IDS_IMAGES_START_TIMES_UNCHANGED_ALL_HEALTHY
DOMINO_PRESERVED=PASS_ID_IMAGE_START_TIME_UNCHANGED_HEALTHY
ROLLBACK_STATUS=READY_NOT_REQUIRED; .previous.env points to 368299e1565e26529f1634574b66e2d07c15b7c6; no rollback exercise performed
BLOCKERS=NONE_FOR_THIS_DEPLOYMENT
NEXT=Review the live website; keep the contact form in demo mode until separately authorized real integration

## Audit and scope

The supplied .151 address identifies dominoserver. Existing Zira deployment and teamfho-server are at .147. The user explicitly confirmed .147 before deployment. Only read-only checks were performed on .151.

Commit: `feat(zira): light premium website and contact form demo`. [GitHub CI](https://github.com/fredyho292018/zira-group-inc/actions/runs/38085673344) completed successfully, including real Linux Docker/runtime smoke checks and SHA-tag publication. [Automatic deployment](https://github.com/fredyho292018/zira-group-inc/actions/runs/38085790743) was skipped because ZIRA_CD_ENABLED=false; this is not a production deployment PASS.

Public DNS queried from 1.1.1.1 reports 104.21.63.42 and 172.67.143.17 for root and WWW. An initial stale-resolution WWW TLS failure disappeared on the final normal-resolution check: both URLs return 200 after following redirects, with certificate verification enabled. Browser navigation to WWW lands on the canonical root. No DNS, resolver cache or Tunnel setting was changed.

On .147: 50 GB free; Zira healthy; all nine TeamFHO/Domino containers healthy and unchanged since the earlier baseline; both cloudflared and cloudflared-zira services active. Origin HTTP: Zira 38081, TeamFHO 28080/18080, Domino 38080 all 200. Deployment files match local SHA256 hashes. Only the matching ZIRA_IMAGE line was inspected from the release environment; credentials were not read or printed.

Local npm ci, Astro check (15 files, no errors/warnings/hints), 28 tests, Astro build, strict Worker type check, Docker build and Compose config passed. Initial npm ci file-lock error resolved by closing the local preview. No existing production service was stopped. No infra, CI, DNS, Tunnel or database changes.

Demo mode validates six editable fields, shows field errors and the exact message “Demo mode — Your information has not been sent.” Button type=button; submit events are prevented. Demo branch exits before API/Turnstile setup. No message or personal data is stored or logged. Consent remains unavailable until a real privacy policy and delivery integration are authorized. Prepared Worker code remains undeployed and inactive.

Validated widths: 1440×900, 768×1024, 393×852 and 430×932; no horizontal overflow, required sections present, no broken loaded images. Browser confirmed six errors and focus on fullName for empty input; valid fictional details produce IDLE with the demo message, never SUCCESS.

## Production evidence

Remote deployment executed the existing /opt/zira-group-inc/deploy.sh after verifying hostname. Only zira-web was recreated; current container ID 3d0abed152ecf4ce6568b7c5aad69fe42b73d1e4fe026647e925b1cc69b8365e. Health passed and the only host binding remains 127.0.0.1:38081→80. A preliminary extra hostname guard was accidentally evaluated on Windows and exited before any deployment mutation; it was corrected to evaluate on the remote host, then deployment succeeded. Rollback was not needed.

The origin HTTP body exactly matches /srv/index.html inside the deployed SHA-tagged image. Root HTTPS and WWW HTTPS bodies also exactly match the new origin HTML, including the light premium title and editable demo form. All three share SHA256 **0200f8ec324994b876a7749e578539c61edae8be8f68dc534f6155f98204b01e**. This confirms the new image content, beyond merely observing HTTP 200. Thirty referenced static assets returned 200 at the origin; all twelve page images loaded in the public browser, along with CSS and JavaScript. No critical JavaScript console errors were observed.

Public form validation was tested with fictional example.test data only: empty input shows six field errors, focuses fullName, and includes the required demo notice. Valid data shows the demo notice and IDLE, never SUCCESS. The browser stays on the page, the button is type=button, and the demo handler returns before any fetch or Turnstile loading. The Worker endpoint and provider are not deployed or activated; no personal data is persisted or logged by the form. No emails were sent.

All nine existing TeamFHO/Domino container IDs, image references and StartedAt values match the pre-deploy inventory and remain healthy. TeamFHO production 28080=200, test 18080=200 and Domino 38080=200. cloudflared and cloudflared-zira remain active; neither was restarted. No Compose down, Docker prune, unrelated container mutation, infrastructure edit or database change occurred.

Public screenshots: [desktop](Generated/ZiraDeploy01/desktop.png), [mobile](Generated/ZiraDeploy01/mobile.png), [contact demo](Generated/ZiraDeploy01/contact-demo.png). [Responsive metrics](Generated/ZiraDeploy01/responsive-metrics.json). Preview and public browser viewport overrides were reset after validation.

The deployed application SHA above remains the release identifier. A separate documentation-only commit records these final results and captures; it does not require a second production rollout. Resolve that documentation revision with git log -1 --format=%H -- Validation/ZIRA_DEPLOY_01_REPORT.md.
