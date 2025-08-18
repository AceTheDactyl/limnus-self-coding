#!/usr/bin/env bash
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }

bold "LIMNUS • Validating local dev setup"

# 1) binaries
command -v bun >/dev/null 2>&1 || die "bun not found. Install Bun: https://bun.sh"
ok "bun found: $(bun --version)"

command -v curl >/dev/null 2>&1 || die "curl not found"
ok "curl found: $(curl --version | head -n1)"

command -v jq >/dev/null 2>&1 || die "jq not found (needed for parsing JSON)"
ok "jq found: $(jq --version)"

# 2) env
API_BASE_DEFAULT="http://localhost:8787"
API_TRPC="${EXPO_PUBLIC_RORK_API_BASE_URL:-${API_BASE_DEFAULT}/api/trpc}"
ok "API base (tRPC): ${API_TRPC}"

# 3) repo sanity
[ -d "./app" ] || warn "app/ not found (Expo) — continuing"
[ -d "./backend" ] || warn "backend/ not found — continuing"
[ -f "package.json" ] || warn "package.json not found — continuing"

# 4) server health (if running)
HEALTH1="${API_BASE_DEFAULT}/api"
HEALTH2="${API_BASE_DEFAULT}/api/health"
HEALTH3="${API_BASE_DEFAULT}/health"
if curl -fsS "$HEALTH1" >/dev/null 2>&1; then
  ok "Server health (GET ${HEALTH1}) responded"
elif curl -fsS "$HEALTH2" >/dev/null 2>&1; then
  ok "Server health (GET ${HEALTH2}) responded"
elif curl -fsS "$HEALTH3" >/dev/null 2>&1; then
  ok "Server health (GET ${HEALTH3}) responded"
else
  warn "Server not responding on ${HEALTH1} or ${HEALTH2} or ${HEALTH3} — this is fine if you haven't started it yet."
fi

bold "Setup looks good. Next: start the server (in another terminal):"
echo "  bun run start"