#!/bin/bash
# ============================================================================
# Acceptance tests for founder authentication persistence fix
# ============================================================================
set -u
BASE="http://localhost:3000"
PASS=0; FAIL=0
ok()   { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }
step() { echo ""; echo "▶ $1"; }

step "TEST 1: Login → refresh → still logged in"
rm -f /tmp/t1.txt
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"founder@planned.app","password":"PlannedFound3r!2026"}' -c /tmp/t1.txt)
echo "  Login response: $LOGIN_RESP"
# "Refresh" = call /api/auth/me with the same cookie (simulates page reload)
ME1=$(curl -s "$BASE/api/auth/me" -b /tmp/t1.txt)
echo "  /api/auth/me after login: $ME1"
echo "$ME1" | grep -q '"email":"founder@planned.app"' && ok "User still logged in after refresh" || bad "User lost after refresh"
# Verify session record exists in DB
SESSION_COUNT=$(python3 -c "import sqlite3; c=sqlite3.connect('/home/z/my-project/db/custom.db').cursor(); c.execute('SELECT COUNT(*) FROM Session WHERE revokedAt IS NULL'); print(c.fetchone()[0])")
echo "  Active sessions in DB: $SESSION_COUNT"
[ "$SESSION_COUNT" -ge "1" ] && ok "Session record exists in DB" || bad "No session record in DB"

step "TEST 2: Login → logout → refresh → remain logged out"
rm -f /tmp/t2.txt /tmp/t2-pre-logout.txt
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"founder@planned.app","password":"PlannedFound3r!2026"}' -c /tmp/t2.txt > /dev/null
# Save a copy of the pre-logout cookie so we can test that the REVOKED JWT is rejected
cp /tmp/t2.txt /tmp/t2-pre-logout.txt
echo "  Logged in. Verifying session is live..."
curl -s "$BASE/api/auth/me" -b /tmp/t2.txt | grep -q 'founder@planned.app' && ok "Session live before logout" || bad "Session not live before logout"
echo "  Calling logout..."
LOGOUT_HEADERS=$(curl -s -X POST "$BASE/api/auth/logout" -b /tmp/t2.txt -c /tmp/t2.txt -D - -o /dev/null)
echo "  Logout Set-Cookie header:"
echo "$LOGOUT_HEADERS" | grep -i "set-cookie" | head -2
echo "  Refreshing (calling /api/auth/me with updated cookie jar)..."
ME2=$(curl -s "$BASE/api/auth/me" -b /tmp/t2.txt)
echo "  /api/auth/me after logout: $ME2"
echo "$ME2" | grep -q '"user":null' && ok "User is null after logout+refresh" || bad "User came back after logout"
echo "  Critical sub-test: hitting /api/auth/me with the PRE-LOGOUT cookie from THIS test (JWT sig still valid, but session revoked)"
ME2B=$(curl -s "$BASE/api/auth/me" -b /tmp/t2-pre-logout.txt)
echo "  /api/auth/me with revoked-session JWT: $ME2B"
echo "$ME2B" | grep -q '"user":null' && ok "Revoked session JWT is rejected (server-side check works!)" || bad "Revoked session JWT still authenticates — BUG"

step "TEST 3: Open second browser → login there → first browser still works"
rm -f /tmp/t3a.txt /tmp/t3b.txt
# Browser A logs in
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"founder@planned.app","password":"PlannedFound3r!2026"}' -c /tmp/t3a.txt > /dev/null
echo "  Browser A logged in."
# Browser B logs in (separate cookie jar)
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"founder@planned.app","password":"PlannedFound3r!2026"}' -c /tmp/t3b.txt > /dev/null
echo "  Browser B logged in."
# Verify both sessions are active in DB
ACTIVE_COUNT=$(python3 -c "import sqlite3; c=sqlite3.connect('/home/z/my-project/db/custom.db').cursor(); c.execute('SELECT COUNT(*) FROM Session WHERE revokedAt IS NULL'); print(c.fetchone()[0])")
echo "  Active sessions in DB: $ACTIVE_COUNT (should be 2)"
# Browser A should still work
MEA=$(curl -s "$BASE/api/auth/me" -b /tmp/t3a.txt)
MEB=$(curl -s "$BASE/api/auth/me" -b /tmp/t3b.txt)
echo "$MEA" | grep -q 'founder@planned.app' && ok "Browser A still works after B logs in" || bad "Browser A lost after B login"
echo "$MEB" | grep -q 'founder@planned.app' && ok "Browser B works" || bad "Browser B doesn't work"
[ "$ACTIVE_COUNT" -ge "2" ] && ok "Two separate session records exist" || bad "Expected 2 sessions, got $ACTIVE_COUNT"

step "TEST 4: Logout on browser A → browser B remains logged in"
# Logout browser A only
curl -s -X POST "$BASE/api/auth/logout" -b /tmp/t3a.txt -c /tmp/t3a.txt > /dev/null
echo "  Browser A logged out."
# A should be logged out
MEA2=$(curl -s "$BASE/api/auth/me" -b /tmp/t3a.txt)
echo "$MEA2" | grep -q '"user":null' && ok "Browser A is logged out" || bad "Browser A still logged in"
# B should still be logged in
MEB2=$(curl -s "$BASE/api/auth/me" -b /tmp/t3b.txt)
echo "$MEB2" | grep -q 'founder@planned.app' && ok "Browser B still logged in (multi-device works!)" || bad "Browser B was logged out too"

step "TEST 5: Revoke browser B session from server → browser B immediately loses access"
# Get browser B's sessionId from the admin sessions list
SESSIONS_LIST=$(curl -s "$BASE/api/admin/sessions" -b /tmp/t3b.txt)
echo "  Sessions list: $SESSIONS_LIST"
# Extract the first active session ID
B_SESSION_ID=$(echo "$SESSIONS_LIST" | python3 -c "import sys, json; d=json.load(sys.stdin); s=[x for x in d['sessions'] if x['revokedAt'] is None]; print(s[0]['id'] if s else '')")
echo "  Browser B's active session ID: $B_SESSION_ID"
if [ -z "$B_SESSION_ID" ]; then
  bad "Could not find an active session to revoke"
else
  # Revoke it via admin endpoint
  REVOKE_RESP=$(curl -s -X POST "$BASE/api/admin/sessions" -b /tmp/t3b.txt -H "Content-Type: application/json" -d "{\"sessionId\":\"$B_SESSION_ID\"}")
  echo "  Revoke response: $REVOKE_RESP"
  # Browser B should immediately lose access on next request
  MEB3=$(curl -s "$BASE/api/auth/me" -b /tmp/t3b.txt)
  echo "  Browser B /api/auth/me after revocation: $MEB3"
  echo "$MEB3" | grep -q '"user":null' && ok "Browser B immediately lost access after server-side revocation" || bad "Browser B still has access after revocation"
  # Verify revokedAt is set in DB
  REVOKED_COUNT=$(python3 -c "import sqlite3; c=sqlite3.connect('/home/z/my-project/db/custom.db').cursor(); c.execute('SELECT COUNT(*) FROM Session WHERE revokedAt IS NOT NULL'); print(c.fetchone()[0])")
  echo "  Revoked sessions in DB: $REVOKED_COUNT"
  [ "$REVOKED_COUNT" -ge "2" ] && ok "Revocation persisted to DB" || bad "Revocation not in DB"
fi

echo ""
echo "================================================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "================================================================"
[ "$FAIL" -eq "0" ] && exit 0 || exit 1
