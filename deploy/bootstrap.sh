#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu 24.04 VPS (Hetzner CX22, Singapore).
# Run as root:  bash bootstrap.sh
# Creates: app user, 2 GB swap, Node 22, Caddy, firewall, release directories.
set -euo pipefail

APP_USER="vetacademia"
APP_DIR="/srv/vetacademia"
NODE_MAJOR="22"

echo "==> system packages"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg git ufw debian-keyring \
  debian-archive-keyring apt-transport-https rsync unzip

echo "==> 2 GB swap (build headroom on a 4 GB box)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> app user"
id -u "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER"

echo "==> Node ${NODE_MAJOR}"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" != "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "==> Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -qq
  apt-get install -y -qq caddy
fi

echo "==> directories"
mkdir -p "$APP_DIR"/{releases,shared/cache,shared/logs}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> firewall (SSH only; Cloudflare reaches Caddy on 443)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> systemd unit"
install -m 644 "$(dirname "$0")/vetacademia.service" /etc/systemd/system/vetacademia.service
systemctl daemon-reload
systemctl enable vetacademia

echo
echo "Bootstrap done. Next:"
echo "  1. Put Cloudflare Origin cert at /etc/caddy/origin.pem and .key"
echo "  2. install -m 644 Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy"
echo "  3. Clone the repo into $APP_DIR/repo and run deploy/deploy.sh"
