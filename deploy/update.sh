#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/team-drsa}"
APP_USER="teamdrsa"
SERVICE="team-drsa"
BRANCH="${BRANCH:-main}"

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run:"
    echo "sudo bash deploy/update.sh"
    exit 1
fi

cd "${APP_DIR}"

echo "======================================"
echo " Team DRSA GitHub Update"
echo "======================================"

echo "[1/7] Downloading latest GitHub code..."

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

sudo -u "${APP_USER}" -H git fetch origin "${BRANCH}"
sudo -u "${APP_USER}" -H git reset --hard "origin/${BRANCH}"

echo "[2/7] Restoring production environment..."

cp /etc/team-drsa/team-drsa.env \
   "${APP_DIR}/.env.local"

chown "${APP_USER}:${APP_USER}" \
    "${APP_DIR}/.env.local"

chmod 600 "${APP_DIR}/.env.local"

echo "[3/7] Installing dependencies..."

if [[ -f package-lock.json ]]; then
    sudo -u "${APP_USER}" -H npm ci
else
    sudo -u "${APP_USER}" -H npm install
fi

echo "[4/7] Type checking..."

sudo -u "${APP_USER}" -H npm run typecheck

echo "[5/7] Linting..."

sudo -u "${APP_USER}" -H npm run lint

echo "[6/7] Building safely..."

BACKUP="/tmp/team-drsa-next-$(date +%s)"

systemctl stop "${SERVICE}"

if [[ -d .next ]]; then
    mv .next "${BACKUP}"
fi

if sudo -u "${APP_USER}" -H npm run build; then
    rm -rf "${BACKUP}"
else
    echo "BUILD FAILED - restoring previous build."

    rm -rf .next

    if [[ -d "${BACKUP}" ]]; then
        mv "${BACKUP}" .next
    fi

    systemctl start "${SERVICE}"

    exit 1
fi

echo "[7/7] Restarting Team DRSA..."

systemctl start "${SERVICE}"

sleep 4

curl -fsS http://127.0.0.1:3000/api/health

echo
echo
echo "Deployment successful."
