# Canonical v1.5.14 R3 installer delta. Apply to the R2 desktop/install.command.
INSTALLER_REVISION="R3"

running_sidedock_pids(){
  local needle pid command
  needle="$TARGET_APP/Contents/MacOS/Electron"
  # Match only processes whose command actually STARTS with SideDock's own
  # Electron executable. Do not grep/awk for the path as a substring: the
  # matcher process itself would then contain the needle and could create a
  # false never-exits loop. Renderer/helper children are intentionally included.
  /bin/ps -axo pid=,command= 2>/dev/null | while read -r pid command; do
    case "$command" in
      "$needle"|"$needle "*) printf '%s\n' "$pid" ;;
    esac
  done
}

stop_running_sidedock(){
  local pids i
  pids="$(running_sidedock_pids | /usr/bin/tr '\n' ' ' | /usr/bin/xargs 2>/dev/null || true)"
  [ -z "$pids" ] && return 0
  echo "  stopping existing SideDock process before atomic runtime/Host handoff..."
  /bin/kill -TERM $pids 2>/dev/null || true
  i=0
  while [ "$i" -lt 30 ]; do
    [ -z "$(running_sidedock_pids)" ] && return 0
    /bin/sleep 0.1
    i=$((i+1))
  done
  pids="$(running_sidedock_pids | /usr/bin/tr '\n' ' ' | /usr/bin/xargs 2>/dev/null || true)"
  [ -z "$pids" ] || /bin/kill -KILL $pids 2>/dev/null || true
  i=0
  while [ "$i" -lt 20 ]; do
    [ -z "$(running_sidedock_pids)" ] && return 0
    /bin/sleep 0.1
    i=$((i+1))
  done
  echo "FATAL: existing SideDock process did not exit; refusing to replace runtime/Host under a live process."
  exit 1
}

# Immediately after managed-state/native-host backup and immediately before COMMIT_STARTED=1:
# Always stop the current SideDock process before switching active runtime or Host.
# Otherwise LaunchServices may reactivate an already-running process whose in-memory
# bootstrap/runtime predates the just-committed receipts.
stop_running_sidedock
COMMIT_STARTED=1

# After the normal [9/9] open/start path:
if /usr/bin/pgrep -x "Google Chrome" >/dev/null 2>&1; then
  echo "Chrome is currently running. The Browser Adapter files are v1.5.14, but Chrome can keep the previous service worker in memory; quit/reopen Chrome once (or click Reload for the SideDock unpacked extension) before the browser release gate."
fi
