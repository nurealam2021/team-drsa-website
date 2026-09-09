#!/usr/bin/env bash

set -Eeuo pipefail

APP_NAME="team-drsa"
APP_USER="teamdrsa"
APP_GROUP="teamdrsa"

APP_DIR="${APP_DIR:-/var/www/team-drsa}"
DATA_DIR="${DATA_DIR:-/var/lib/team-drsa-website}"
ENV_DIR="${ENV_DIR:-/etc/team-drsa}"
ENV_FILE="${ENV_DIR}/team-drsa.env"

PORT="${PORT:-3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@teamdrsa.com}"

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
    echo "ERROR: Run with sudo:"
    echo "sudo bash deploy/install.sh"
    exit 1
fi

echo
echo "======================================"
echo " Team DRSA Production Installer"
echo "======================================"
echo

echo "[1/10] Installing system packages..."

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    git \
    nginx \
    rsync \
    openssl

echo "[2/10] Checking Node.js..."

NEED_NODE=0

if ! command -v node >/dev/null 2>&1; then
    NEED_NODE=1
else
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"

    if (( NODE_MAJOR < 20 )); then
        NEED_NODE=1
    fi
fi

if (( NEED_NODE == 1 )); then
    echo "Installing Node.js 22 LTS..."

    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

echo "[3/10] Creating application user..."

if ! id "${APP_USER}" >/dev/null 2>&1; then
    useradd \
        --system \
        --create-home \
        --home-dir /var/lib/teamdrsa \
        --shell /usr/sbin/nologin \
        "${APP_USER}"
fi

echo "[4/10] Preparing application directories..."

mkdir -p "${APP_DIR}"
mkdir -p "${DATA_DIR}"
mkdir -p "${ENV_DIR}"

if [[ "$(realpath "${SOURCE_DIR}")" != "$(realpath "${APP_DIR}")" ]]; then
    echo "Copying repository to ${APP_DIR}..."

    rsync -a --delete \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=.env \
        --exclude=.env.local \
        "${SOURCE_DIR}/" "${APP_DIR}/"
fi

chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
chown -R "${APP_USER}:${APP_GROUP}" "${DATA_DIR}"
chmod 700 "${DATA_DIR}"

echo "[5/10] Configuring environment..."

if [[ -z "${SITE_URL:-}" ]]; then
    SERVER_IP="$(
        hostname -I 2>/dev/null |
        awk '{
            for (i=1;i<=NF;i++) {
                if ($i !~ /:/ && $i !~ /^127\./) {
                    print $i;
                    exit
                }
            }
        }'
    )"

    SERVER_IP="${SERVER_IP:-127.0.0.1}"
    SITE_URL="http://${SERVER_IP}"
fi

NEW_INSTALL=0

if [[ ! -f "${ENV_FILE}" ]]; then
    NEW_INSTALL=1

    GENERATED_ADMIN_PASSWORD="$(openssl rand -hex 12)"
    GENERATED_ADMIN_SECRET="$(openssl rand -hex 32)"

    cat > "${ENV_FILE}" <<ENVEOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=${SITE_URL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${GENERATED_ADMIN_PASSWORD}
ADMIN_SECRET=${GENERATED_ADMIN_SECRET}
TEAM_DRSA_STORAGE_DIR=${DATA_DIR}
ENVEOF

    chmod 600 "${ENV_FILE}"
    chown root:root "${ENV_FILE}"
fi

# Next.js also needs build-time environment.
cp "${ENV_FILE}" "${APP_DIR}/.env.local"

chown "${APP_USER}:${APP_GROUP}" "${APP_DIR}/.env.local"
chmod 600 "${APP_DIR}/.env.local"

echo "[6/10] Installing initial CMS content..."

if [[ ! -f "${DATA_DIR}/site-content.json" ]] && \
   [[ -f "${APP_DIR}/deploy/seed/site-content.json" ]]; then

    cp "${APP_DIR}/deploy/seed/site-content.json" \
       "${DATA_DIR}/site-content.json"

    chown "${APP_USER}:${APP_GROUP}" \
        "${DATA_DIR}/site-content.json"

    chmod 600 "${DATA_DIR}/site-content.json"
fi

echo "[7/10] Installing Node dependencies..."

cd "${APP_DIR}"

chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"

if [[ -f package-lock.json ]]; then
    sudo -u "${APP_USER}" -H npm ci
else
    sudo -u "${APP_USER}" -H npm install
fi

echo "[8/10] Validating and building Team DRSA..."

sudo -u "${APP_USER}" -H npm run typecheck
sudo -u "${APP_USER}" -H npm run lint
sudo -u "${APP_USER}" -H npm run build

echo "[9/10] Creating systemd service..."

cat > "/etc/systemd/system/${APP_NAME}.service" <<SERVICEEOF
[Unit]
Description=Team DRSA Website
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}

WorkingDirectory=${APP_DIR}

Environment=NODE_ENV=production
EnvironmentFile=${ENV_FILE}

ExecStart=/usr/bin/npm start -- -H 127.0.0.1 -p ${PORT}

Restart=on-failure
RestartSec=5

PrivateTmp=true
NoNewPrivileges=true
UMask=0077

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable "${APP_NAME}"

echo "[10/10] Configuring Nginx..."

cat > /etc/nginx/sites-available/team-drsa <<NGINXEOF
server {
    listen 80;
    listen [::]:80;

    server_name _;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:${PORT};

        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 90s;
    }
}
NGINXEOF

ln -sfn \
    /etc/nginx/sites-available/team-drsa \
    /etc/nginx/sites-enabled/team-drsa

rm -f /etc/nginx/sites-enabled/default

nginx -t

systemctl enable nginx
systemctl restart nginx

systemctl restart "${APP_NAME}"

echo
echo "Waiting for Team DRSA..."
sleep 4

if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
    echo "Health check: PASS"
else
    echo "WARNING: Health check failed."
    echo
    systemctl status "${APP_NAME}" --no-pager || true
fi

if (( NEW_INSTALL == 1 )); then
    CREDS_FILE="/root/team-drsa-install-credentials.txt"

    cat > "${CREDS_FILE}" <<CREDSEOF
Team DRSA installation credentials

Website:
${SITE_URL}

Admin:
${SITE_URL}/admin

Admin Email:
${ADMIN_EMAIL}

Temporary Admin Password:
${GENERATED_ADMIN_PASSWORD}

Generated:
$(date -Is)

IMPORTANT:
Change/manage the admin account after login.
Keep this file private.
CREDSEOF

    chmod 600 "${CREDS_FILE}"

    echo
    echo "======================================"
    echo " Installation Complete"
    echo "======================================"
    echo
    echo "Website:"
    echo "  ${SITE_URL}"
    echo
    echo "Admin:"
    echo "  ${SITE_URL}/admin"
    echo
    echo "Admin Email:"
    echo "  ${ADMIN_EMAIL}"
    echo
    echo "Temporary Admin Password:"
    echo "  ${GENERATED_ADMIN_PASSWORD}"
    echo
    echo "Credentials also saved to:"
    echo "  ${CREDS_FILE}"
else
    echo
    echo "======================================"
    echo " Installation/repair complete"
    echo "======================================"
    echo
    echo "Existing admin credentials were preserved."
fi

echo
echo "Service status:"
systemctl --no-pager --full status "${APP_NAME}" || true
