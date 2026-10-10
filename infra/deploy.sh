#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd /opt/zira-group-inc
exec 9>.deploy.lock
flock -n 9 || { echo 'Another Zira deployment is running.' >&2; exit 1; }
image=${1:?Usage: deploy.sh ghcr.io/fredyho292018/zira-group-inc:FULL_SHA}
[[ "$image" =~ ^ghcr\.io/fredyho292018/zira-group-inc:[0-9a-f]{40}$ ]] || { echo 'Full SHA GHCR image required.' >&2; exit 1; }
if docker container inspect zira-web >/dev/null 2>&1; then
  project=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' zira-web)
  [[ "$project" == zira-group-inc ]] || { echo 'Foreign container name collision.' >&2; exit 1; }
fi
previous=''
if [[ -f .env ]]; then
  previous=$(sed -n 's/^ZIRA_IMAGE=//p' .env)
  [[ "$previous" =~ ^ghcr\.io/fredyho292018/zira-group-inc:[0-9a-f]{40}$ ]] || { echo 'Invalid existing release state.' >&2; exit 1; }
fi
printf 'ZIRA_IMAGE=%s\n' "$image" > .candidate.env
compose=(docker compose --project-name zira-group-inc --env-file .candidate.env -f compose.yaml)
"${compose[@]}" config --quiet
docker pull "$image"
recover() {
  local failure=$?
  trap - ERR
  echo 'Zira deployment failed; restoring previous release.' >&2
  if [[ -n "$previous" ]]; then
    printf 'ZIRA_IMAGE=%s\n' "$previous" > .candidate.env
    "${compose[@]}" up -d --no-deps --wait --wait-timeout 90 zira-web || { echo 'ROLLBACK_FAILED: manual intervention required.' >&2; exit 1; }
    curl --fail --silent --show-error --max-time 10 http://127.0.0.1:38081/health.txt | grep -qx zira-ok || { echo 'ROLLBACK_HTTP_FAILED' >&2; exit 1; }
  else
    "${compose[@]}" rm --stop --force zira-web
  fi
  rm -f .candidate.env
  exit "$failure"
}
trap recover ERR
"${compose[@]}" up -d --no-deps --wait --wait-timeout 90 zira-web
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:38081/health.txt | grep -qx zira-ok
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:38081/ | grep -q 'Building Your Vision'
if [[ -n "$previous" && "$previous" != "$image" ]]; then
  printf 'ZIRA_IMAGE=%s\n' "$previous" > .previous.env
fi
mv .candidate.env .env
trap - ERR
echo "DEPLOY_PASS=$image"
