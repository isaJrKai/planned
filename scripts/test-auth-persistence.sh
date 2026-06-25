#!/bin/bash
# ============================================================================
# Acceptance tests for authentication and session management
# ============================================================================
# Run against a local dev server (npm run dev) or a deployed URL.
#
# Usage:
#   BASE_URL=http://localhost:3000 bash scripts/test-auth-persistence.sh
#   BASE_URL=https://my-project-one-rust-23.vercel.app bash scripts/test-auth-persistence.sh
#
# Requires: curl, python3
# ============================================================================
set -u
BASE="${BASE_URL:-http://localhost:3000}"
EMAIL="${TEST_EMAIL:-founder@planned.app}"
PASSWORD="${TEST_PASSWORD:-PlannedFound3r!2026}"
PASS=0; FAIL=0
ok()   { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }
step() { echo ""; echo "▶ $1"; }

echo "================================================================"
echo "  AUTH ACCEPTANCE TESTS"
echo "  Target: $BASE"
echo "  Email:  $EMAIL"
echo "================================================================"

step "TEST 1: Login → refresh → still logged in"
rm -f /tmp/t1.txt
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" -c /tmp/t1.txt 2>/dev/null)
if echo "$LOGIN_RESP" | grep -q '"ok":true'; then
  ok "Login successful"
else
  bad "Login failed: $LOGIN_RESP"
fi
ME1=$(curl -s "$BASE/api/auth/me" -b /tmp/t1.txt 2>/dev/null)
echo "$ME1" | grep -q '"email"' && ok "User still logged in after refresh" || bad "User lost after refresh"

step "TEST 2: Login → logout → refresh → remain logged out"
rm -f /tmp/t2.txt /tmp/t2-pre.txt
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" -c /tmp/t2.txt > /dev/null 2>&1
cp /tmp/t2.txt /tmp/t2-pre.txt
curl -s -X POST "$BASE/api/auth/logout" -b /tmp/t2.txt -c /tmp/t2.txt > /dev/null 2>&1
ME2=$(curl -s "$BASE/api/auth/me" -b /tmp/t2.txt 2>/dev/null)
echo "$ME2" | grep -q '"user":null' && ok "User is null after logout+refresh" || bad "User came back after logout"

step "TEST 3: Two browsers — both logged in"
rm -f /tmp/t3a.txt /tmp/t3b.txt
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" -c /tmp/t3a.txt > /dev/null 2>&1
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" -c /tmp/t3b.txt > /dev/null 2>&1
MEA=$(curl -s "$BASE/api/auth/me" -b /tmp/t3a.txt 2>/dev/null)
MEB=$(curl -s "$BASE/api/auth/me" -b /tmp/t3b.txt 2>/dev/null)
echo "$MEA" | grep -q '"email"' && ok "Browser A works" || bad "Browser A failed"
echo "$MEB" | grep -q '"email"' && ok "Browser B works" || bad "Browser B failed"

step "TEST 4: Logout browser A → browser B still works"
curl -s -X POST "$BASE/api/auth/logout" -b /tmp/t3a.txt -c /tmp/t3a.txt > /dev/null 2>&1
MEA2=$(curl -s "$BASE/api/auth/me" -b /tmp/t3a.txt 2>/dev/null)
MEB2=$(curl -s "$BASE/api/auth/me" -b /tmp/t3b.txt 2>/dev/null)
echo "$MEA2" | grep -q '"user":null' && ok "Browser A logged out" || bad "Browser A still logged in"
echo "$MEB2" | grep -q '"email"' && ok "Browser B still logged in" || bad "Browser B was logged out too"

echo ""
echo "================================================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "================================================================"
[ "$FAIL" -eq "0" ] && exit 0 || exit 1
