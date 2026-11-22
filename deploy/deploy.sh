#!/usr/bin/env bash
# Zero-downtime-ish deploys with instant rollback.
#
#   ./deploy.sh                 deploy origin/main
#   ./deploy.sh fix/branch      deploy another branch
#   ./deploy.sh --rollback      repoint "current" at the previous release
#
# Layout:
#   /srv/vetacademia/repo                 git clone (source of truth)
#   /srv/vetacademia/releases/<stamp>/    one directory per deploy
#   /srv/vetacademia/current -> releases/<stamp>
#   /srv/vetacademia/shared/env           the real .env (symlinked per release)
#   /srv/vetacademia/shared/cache         ISR cache, survives deploys
set -euo pipefail

APP_DIR="/srv/vetacademia"
REPO_DIR="$APP_DIR/repo"
APP_USER="vetacademia"
KEEP_RELEASES=4

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

repoint() {
  local target="$1"
  ln -sfn "$target" "$APP_DIR/current.tmp"
  mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
  systemctl restart vetacademia
}

wait_healthy() {
  for i in $(seq 1 30); do
    code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.vetacademia.in' \
      http://127.0.0.1:3000/ || echo 000)
    case "$code" in
      200|301|302|307|308) log "app healthy (HTTP $code)"; return 0 ;;
    esac
    sleep 2
  done
  fail "app did not become healthy; roll back with: $0 --rollback"
}

# ---------------------------------------------------------------- rollback
if [ "${1:-}" = "--rollback" ]; then
  current=$(readlink -f "$APP_DIR/current")
  previous=$(ls -1dt "$APP_DIR"/releases/*/ | sed 's:/$::' | grep -v "^${current}$" | head -1)
  [ -n "$previous" ] || fail "no previous release found"
  log "rolling back to $previous"
  repoint "$previous"
  wait_healthy
  exit 0
fi

BRANCH="${1:-main}"
STAMP="$(date +%Y%m%d-%H%M%S)"
REL="$APP_DIR/releases/$STAMP"

[ -f "$APP_DIR/shared/env" ] || fail "missing $APP_DIR/shared/env (the production .env)"
mkdir -p "$APP_DIR/releases" "$APP_DIR/shared/cache" "$APP_DIR/shared/logs"

log "fetching $BRANCH"
if [ ! -d "$REPO_DIR/.git" ]; then
  fail "clone the repo to $REPO_DIR first (see docs/migration-vercel-to-hetzner.md)"
fi
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" reset --hard "origin/$BRANCH"
SHA=$(git -C "$REPO_DIR" rev-parse --short HEAD)
log "deploying $BRANCH @ $SHA"

log "staging release $REL"
mkdir -p "$REL"
rsync -a --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude 'backups' --exclude '*.log' \
  "$REPO_DIR/" "$REL/"

ln -sfn "$APP_DIR/shared/env" "$REL/.env"
mkdir -p "$REL/.next"
ln -sfn "$APP_DIR/shared/cache" "$REL/.next/cache"

cd "$REL"

log "installing dependencies"
npm ci --no-audit --no-fund

log "prisma generate + migrate"
npx prisma generate
npx prisma migrate deploy

log "building (this is the slow part; expect 2-5 min)"
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=3072"
npm run build

log "pruning dev dependencies"
npm prune --omit=dev

# The build runs as root but the service runs as $APP_USER: without this the
# app cannot write its ISR/fetch cache at runtime (EACCES -> 500s on
# revalidate) and cannot read anything the build left root-owned.
log "fixing ownership for $APP_USER"
chown -R "$APP_USER:$APP_USER" "$REL" "$APP_DIR/shared/cache"

log "switching current -> $STAMP"
repoint "$REL"
wait_healthy

log "cleaning old releases (keeping $KEEP_RELEASES)"
ls -1dt "$APP_DIR"/releases/*/ | sed 's:/$::' | tail -n +$((KEEP_RELEASES + 1)) \
  | xargs -r rm -rf

log "done: $BRANCH @ $SHA is live"
echo "   rollback: $0 --rollback"
