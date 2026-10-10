#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/zira-group-inc
[[ -f .previous.env ]] || { echo 'No previous successful release available.' >&2; exit 1; }
image=$(sed -n 's/^ZIRA_IMAGE=//p' .previous.env)
exec bash ./deploy.sh "$image"
