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

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
    echo "ERROR: Run with sudo:"
    echo "sudo bash deploy/install.sh"
    exit 1
fi

validate_ipv4() {
    local ip="$1"
    local IFS=.
    local -a octets
    read -r -a octets <<< "$ip"
    [[ "${#octets[@]}" -eq 4 ]] || return 1
    local octet
    for octet in "${octets[@]}"; do
        [[ "$octet" =~ ^[0-9]+$ ]] || return 1
        (( octet >= 0 && octet <= 255 )) || return 1
    done
}

prompt_secret() {
    local label="$1"
    local value
    while true; do
        read -r -s -p "$label: " value
        echo
        if [[ -n "$value" ]]; then
            printf '%s' "$value"
            return 0
        fi
        echo "Value cannot be empty."
    done
}

echo
echo "======================================"
echo " Team DRSA Production Installer"
echo "======================================"
echo

echo "This installer configures Node.js 22 LTS, Nginx, systemd,"
echo "persistent CMS storage and the Team DRSA admin account."
echo "The current application uses JSON file storage; PostgreSQL is not required."
echo

echo "[1/11] Collecting production settings..."

if [[ ! -f "${ENV_FILE}" ]]; then
    DEFAULT_IP="$(hostname -I 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i !~ /:/ && $i !~ /^127\./){print $i; exit}}')"
    DEFAULT_IP="${DEFAULT_IP:-127.0.0.1}"

    while true; do
        read -r -p "Server IPv4 address [${DEFAULT_IP}]: " SERVER_IP
        SERVER_IP="${SERVER_IP:-$DEFAULT_IP}"
        if validate_ipv4 "$SERVER_IP"; then
            break
        fi
        echo "Invalid IPv4 address. Example: 192.168.22.253"
    done

    SITE_URL="http://${SERVER_IP}"

    read -r -p "Admin email [admin@teamdrsa.com]: " ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@teamdrsa.com}"

    while true; do
        ADMIN_PASSWORD="$(prompt_secret "Admin password (minimum 12 characters)")"
        if (( ${#ADMIN_PASSWORD} >= 12 )); then
            break
        fi
        echo "Password must contain at least 12 characters."
    done

    while true; do
        ADMIN_SECRET="$(prompt_secret "ADMIN_SECRET (minimum 32 characters)")"
        if (( ${#ADMIN_SECRET} >= 32 )); then
            break
        fi
        echo "ADMIN_SECRET must contain at least 32 characters."
    done

    NEW_INSTALL=1
else
    NEW_INSTALL=0
    echo "Existing production environment detected: ${ENV_FILE}"
    echo "Existing admin credentials and ADMIN_SECRET will be preserved."
fi

echo "[2/11] Installing system packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    git \
    nginx \
    rsync \
    openssl

echo "[3/11] Checking Node.js..."
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

echo "[4/11] Creating application user..."
if ! id "${APP_USER}" >/dev/null 2>&1; then
    useradd --system --create-home --home-dir /var/lib/teamdrsa --shell /usr/sbin/nologin "${APP_USER}"
fi

echo "[5/11] Preparing application directories..."
mkdir -p "${APP_DIR}" "${DATA_DIR}" "${ENV_DIR}"

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

echo "[6/11] Configuring environment..."
if (( NEW_INSTALL == 1 )); then
    cat > "${ENV_FILE}" <<ENVEOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=${SITE_URL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_SECRET=${ADMIN_SECRET}
TEAM_DRSA_STORAGE_DIR=${DATA_DIR}
ENVEOF
    unset ADMIN_PASSWORD ADMIN_SECRET
    chmod 600 "${ENV_FILE}"
    chown root:root "${ENV_FILE}"
fi

cp "${ENV_FILE}" "${APP_DIR}/.env.local"
chown "${APP_USER}:${APP_GROUP}" "${APP_DIR}/.env.local"
chmod 600 "${APP_DIR}/.env.local"

echo "[7/11] Installing initial CMS content..."
if [[ ! -f "${DATA_DIR}/site-content.json" ]] && [[ -f "${APP_DIR}/deploy/seed/site-content.json" ]]; then
    cp "${APP_DIR}/deploy/seed/site-content.json" "${DATA_DIR}/site-content.json"
    chown "${APP_USER}:${APP_GROUP}" "${DATA_DIR}/site-content.json"
    chmod 600 "${DATA_DIR}/site-content.json"
fi

echo "[8/11] Installing Node dependencies..."
cd "${APP_DIR}"
chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
if [[ -f package-lock.json ]]; then
    sudo -u "${APP_USER}" -H npm ci
else
    sudo -u "${APP_USER}" -H npm install
fi

echo "[9/11] Validating and building Team DRSA..."
sudo -u "${APP_USER}" -H npm run typecheck
sudo -u "${APP_USER}" -H npm run lint
sudo -u "${APP_USER}" -H npm run build

echo "[10/11] Creating systemd service and Nginx..."
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

ln -sfn /etc/nginx/sites-available/team-drsa /etc/nginx/sites-enabled/team-drsa
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl daemon-reload
systemctl enable "${APP_NAME}"
systemctl enable nginx
systemctl restart nginx
systemctl restart "${APP_NAME}"

echo "[11/11] Running health and admin bootstrap checks..."
sleep 4

if ! curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
    echo "ERROR: Team DRSA health check failed."
    systemctl --no-pager --full status "${APP_NAME}" || true
    exit 1
fi

echo "Health check: PASS"

if (( NEW_INSTALL == 1 )); then
    ADMIN_EMAIL_CHECK="$(grep '^ADMIN_EMAIL=' "${ENV_FILE}" | cut -d= -f2-)"
    ADMIN_PASSWORD_CHECK="$(grep '^ADMIN_PASSWORD=' "${ENV_FILE}" | cut -d= -f2-)"
    ADMIN_LOGIN_RESPONSE="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/api/admin/login" \
        -H 'Content-Type: application/json' \
        --data "$(printf '{\"email\":%s,\"password\":%s}' "$(printf '%s' "$ADMIN_EMAIL_CHECK" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" "$(printf '%s' "$ADMIN_PASSWORD_CHECK" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")")"

    if ! printf '%s' "${ADMIN_LOGIN_RESPONSE}" | grep -q '"ok":true'; then
        echo "ERROR: Admin bootstrap/login verification failed."
        echo "Check: sudo journalctl -u ${APP_NAME} -n 100 --no-pager"
        exit 1
    fi

    CREDS_FILE="/root/team-drsa-install-credentials.txt"
    cat > "${CREDS_FILE}" <<CREDSEOF
Team DRSA installation credentials

Website:
${SITE_URL}

Admin:
${SITE_URL}/admin

Admin Email:
${ADMIN_EMAIL_CHECK}

Admin Password:
${ADMIN_PASSWORD_CHECK}

ADMIN_SECRET is stored securely in:
${ENV_FILE}

Generated:
$(date -Is)

IMPORTANT:
Keep this file private. Change the admin password after first login if desired.
CREDSEOF
    chmod 600 "${CREDS_FILE}"
    unset ADMIN_EMAIL_CHECK ADMIN_PASSWORD_CHECK ADMIN_LOGIN_RESPONSE

    echo
    echo "======================================"
    echo " Installation Complete"
    echo "======================================"
    echo "Website: ${SITE_URL}"
    echo "Admin:   ${SITE_URL}/admin"
    echo "Credentials: ${CREDS_FILE}"
    echo "Admin bootstrap/login: PASS"
else
    echo
    echo "======================================"
    echo " Installation/repair complete"
    echo "======================================"
    echo "Existing admin credentials were preserved."
fi

echo
echo "Service status:"
systemctl --no-pager --full status "${APP_NAME}" || true
