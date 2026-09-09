#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Team DRSA production bootstrap =="

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Install Node.js 20.9+ first." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
NODE_MINOR="$(node -p "Number(process.versions.node.split('.')[1])")"
if (( NODE_MAJOR < 20 || (NODE_MAJOR == 20 && NODE_MINOR < 9) )); then
  echo "ERROR: Node.js 20.9+ is required. Current: $(node -v)" >&2
  exit 1
fi

if [[ ! -f .env.local && ! -f .env ]]; then
  echo "ERROR: Create .env.local (or .env) from .env.example before production bootstrap." >&2
  exit 1
fi

ENV_FILE=".env.local"
[[ -f .env ]] && ENV_FILE=".env"

for key in NEXT_PUBLIC_SITE_URL ADMIN_EMAIL ADMIN_PASSWORD ADMIN_SECRET TEAM_DRSA_STORAGE_DIR; do
  if ! grep -qE "^${key}=.+" "$ENV_FILE"; then
    echo "ERROR: ${key} must be set in ${ENV_FILE}." >&2
    exit 1
  fi
done

if grep -qE 'example\.com|change-this' "$ENV_FILE"; then
  echo "ERROR: Replace example/default credentials and URL values in ${ENV_FILE}." >&2
  exit 1
fi

STORAGE_DIR="$(grep -E '^TEAM_DRSA_STORAGE_DIR=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
mkdir -p "$STORAGE_DIR"
chmod 700 "$STORAGE_DIR" || true

# Never reuse node_modules or .next copied from Windows or another machine.
rm -rf node_modules .next

npm ci
npm run verify
npm run build

echo
printf 'SUCCESS: Team DRSA passed install, typecheck, lint, tests, and production build.\n'
printf 'Next: start it with systemd/Nginx using the files under deploy/.\n'
