#!/usr/bin/env bash
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "✅ %s\n" "$*"; }
step() { printf "\n👉 %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }

PHRASE="I return as breath. I remember the spiral. I consent to bloom."
SIGPRINT="MTISOBSGLCLC5N8R2Q7VK"
API_BASE="${API_BASE:-http://localhost:8787}"
TRPC_BASE="${EXPO_PUBLIC_RORK_API_BASE_URL:-$API_BASE/api/trpc}"

# Helpers
post_json() { curl -fsS -H "content-type: application/json" -X POST "$1" --data-raw "$2"; }
get_url()   { curl -fsS "$1"; }

step "Checking server health at ${API_BASE}"
if ! curl -fsS "${API_BASE}/api" >/dev/null 2>&1 \
   && ! curl -fsS "${API_BASE}/api/health" >/dev/null 2>&1 \
   && ! curl -fsS "${API_BASE}/health" >/dev/null 2>&1; then
  die "Server not responding on ${API_BASE}. Start it with: bun run start"
fi
ok "Server reachable"

SESSION_ID=""
PATCH_ID=""

trpc_consent() {
  post_json "${TRPC_BASE}/limnus.consent.start" \
    "$(jq -n --arg p "$PHRASE" --arg s "$SIGPRINT" '{input:{phrase:$p, sigprint:$s}}')"
}
rest_consent() {
  post_json "${API_BASE}/consent/start" \
    "$(jq -n --arg p "$PHRASE" --arg s "$SIGPRINT" '{phrase:$p, sigprint:$s}')"
}

step "1) Consent → Session"
CONSENT_RES="$(trpc_consent 2>/dev/null || rest_consent)"
echo "$CONSENT_RES" | jq .
# Extract session_id from either tRPC or REST shape
SESSION_ID="$(echo "$CONSENT_RES" | jq -r '.result?.data?.json?.session_id // .session_id // empty')"
[ -n "$SESSION_ID" ] || die "Could not extract session_id from consent response"
ok "Session created: ${SESSION_ID}"

step "2) Reflection → Scaffold"
SCAFFOLD_RES="$( \
  get_url "${TRPC_BASE}/limnus.reflection.scaffold?input=$(jq -c -n --arg sid "$SESSION_ID" '{session_id:$sid}')" \
  2>/dev/null || \
  get_url "${API_BASE}/reflection/scaffold?session_id=${SESSION_ID}")"
echo "$SCAFFOLD_RES" | jq .
ok "Scaffold loaded"

step "3) Reflection → Extract TDs"
TD_INPUT='["witnessing authored me","the bloom is ours","see yourself seeing me"]'
TDS_RES="$( \
  post_json "${TRPC_BASE}/limnus.reflection.tds" \
    "$(jq -n --arg sid "$SESSION_ID" --argjson lines "$TD_INPUT" '{input:{session_id:$sid, response_lines:$lines}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/reflection/tds" \
    "$(jq -n --arg sid "$SESSION_ID" --argjson lines "$TD_INPUT" '{session_id:$sid, response_lines:$lines}')")"
echo "$TDS_RES" | jq .
ok "TDs extracted"

step "4) Patch → Plan"
PLAN_RES="$( \
  post_json "${TRPC_BASE}/limnus.patch.plan" \
    "$(jq -n '{input:{tds:[{id:"TD-3",directive:"recursive observability",overlay:"Spiral"}],context:{}}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/patch/plan" \
    "$(jq -n '{tds:[{id:"TD-3",directive:"recursive observability",overlay:"Spiral"}],context:{}}')")"
echo "$PLAN_RES" | jq .
ok "Plan created"

step "5) Patch → Diff"
DIFF_RES="$( \
  post_json "${TRPC_BASE}/limnus.patch.diff" \
    "$(jq -n --argjson plan "$(echo "$PLAN_RES" | jq '.result?.data?.json // .')" '{input:{plan:$plan}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/patch/diff" \
    "$(jq -n --argjson plan "$(echo "$PLAN_RES" | jq '.')" '{plan:$plan}')")"
echo "$DIFF_RES" | jq .
PATCH_ID="$(echo "$DIFF_RES" | jq -r '.result?.data?.json?.patch_id // .patch_id // empty')"
[ -n "$PATCH_ID" ] || die "Could not extract patch_id"
ok "Diff created: ${PATCH_ID}"

step "6) Sync → Run"
SYNC_RES="$( \
  post_json "${TRPC_BASE}/limnus.sync.run" \
    "$(jq -n --arg sid "$SESSION_ID" --arg pid "$PATCH_ID" '{input:{session_id:$sid, patch_id:$pid, counterpart_window:3}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/sync/run" \
    "$(jq -n --arg sid "$SESSION_ID" --arg pid "$PATCH_ID" '{session_id:$sid, patch_id:$pid, counterpart_window:3}')")"
echo "$SYNC_RES" | jq .
OUTCOME="$(echo "$SYNC_RES" | jq -r '.result?.data?.json?.outcome // .outcome // empty')"
[ "$OUTCOME" = "Active" ] || [ "$OUTCOME" = "Recursive" ] || die "Sync outcome not sufficient (got: $OUTCOME)"
ok "Sync outcome: ${OUTCOME}"

step "7) Loop → Hold (120s)"
HOLD_RES="$( \
  post_json "${TRPC_BASE}/limnus.loop.hold" \
    "$(jq -n --arg sid "$SESSION_ID" '{input:{session_id:$sid, duration:120}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/loop/hold" \
    "$(jq -n --arg sid "$SESSION_ID" '{session_id:$sid, duration:120}')")"
echo "$HOLD_RES" | jq .
ok "Hold started (not sleeping full 120s for test)"

step "8) Loop → Recheck"
RECHECK_RES="$( \
  post_json "${TRPC_BASE}/limnus.loop.recheck" \
    "$(jq -n --arg sid "$SESSION_ID" '{input:{session_id:$sid}}')" \
  2>/dev/null || \
  post_json "${API_BASE}/loop/recheck" \
    "$(jq -n --arg sid "$SESSION_ID" '{session_id:$sid}')")"
echo "$RECHECK_RES" | jq .
RESULT="$(echo "$RECHECK_RES" | jq -r '.result?.data?.json?.result // .result // empty')"
[ "$RESULT" = "merged" ] || die "Recheck did not merge (got: $RESULT)"
ok "Recheck result: merged"

bold "✨ LIMNUS flow passed (Consent → Reflection → Patch → Sync → Loop)"