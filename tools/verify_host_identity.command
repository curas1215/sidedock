#!/bin/sh
set -eu

APP="${SIDEDOCK_APP_PATH:-$HOME/Applications/SideDock.app}"
EXPECTED_BUNDLE="com.sidedock.desktop"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

printf 'SideDock H1 Host Identity Verification\n'
printf 'Canonical app: %s\n' "$APP"

[ -d "$APP" ] || fail "canonical SideDock.app is missing"
[ -f "$APP/Contents/Info.plist" ] || fail "Info.plist is missing"

BUNDLE_ID=$(/usr/bin/defaults read "$APP/Contents/Info" CFBundleIdentifier 2>/dev/null || true)
[ "$BUNDLE_ID" = "$EXPECTED_BUNDLE" ] || fail "bundle id is '$BUNDLE_ID', expected '$EXPECTED_BUNDLE'"
printf 'PASS bundle id: %s\n' "$BUNDLE_ID"

printf '\nCode signature summary:\n'
/usr/bin/codesign -dv --verbose=4 "$APP" 2>&1 || fail "codesign verification could not read signature"

TEAM_ID=$(/usr/bin/codesign -dv --verbose=4 "$APP" 2>&1 | /usr/bin/sed -n 's/^TeamIdentifier=//p' | /usr/bin/head -n 1)
if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" = "not set" ]; then
  fail "release Host has no stable TeamIdentifier"
fi
printf 'PASS TeamIdentifier: %s\n' "$TEAM_ID"

REQ=$(/usr/bin/codesign -dr - "$APP" 2>&1 | /usr/bin/sed -n 's/^designated => //p')
[ -n "$REQ" ] || fail "release Host has no designated requirement"
printf 'PASS designated requirement exists\n'

printf '\nChecking duplicate SideDock bundles...\n'
DUP_COUNT=0
for ROOT in "$HOME/Applications" /Applications; do
  [ -d "$ROOT" ] || continue
  for CAND in "$ROOT"/SideDock*.app; do
    [ -d "$CAND" ] || continue
    CAND_ID=$(/usr/bin/defaults read "$CAND/Contents/Info" CFBundleIdentifier 2>/dev/null || true)
    if [ "$CAND_ID" = "$EXPECTED_BUNDLE" ]; then
      printf '  %s\n' "$CAND"
      DUP_COUNT=$((DUP_COUNT + 1))
    fi
  done
done

[ "$DUP_COUNT" -eq 1 ] || fail "expected exactly one launchable SideDock bundle in canonical roots; found $DUP_COUNT"
printf 'PASS no duplicate canonical-root SideDock bundles\n'

RUNNING=$(/usr/bin/pgrep -f '/SideDock.app/Contents/MacOS/' || true)
if [ -n "$RUNNING" ]; then
  printf '\nRunning SideDock PID(s): %s\n' "$RUNNING"
else
  printf '\nINFO: SideDock is not currently running.\n'
fi

printf '\nPASS: static H1 identity gates passed.\n'
printf 'NOTE: this tool does not claim Screen Recording or Accessibility permission success.\n'
printf 'Those gates require authoritative checks from the running Host plus an exact-window capture proof.\n'
