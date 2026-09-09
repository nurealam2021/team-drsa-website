#!/usr/bin/env bash
set -euo pipefail
URL="${TEAM_DRSA_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
curl --fail --silent --show-error --max-time 5 "$URL" >/dev/null
printf 'Team DRSA health check passed: %s\n' "$URL"
