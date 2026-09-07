# SideDock TASK_STATE

Updated: 2026-09-07
Status: `CODE_VALIDATED_REAL_MAC_V1514_STABLE_TCC_GATE_PENDING`
Release: `v1.5.14`
Policy: NON_DEGRADABLE / NO_FABRICATED_PASS

## Current completion

v1.5.14 code-side and packaging work is complete. The v1.5.13 exact-window/PreActivationSession/Chrome-window binding path was preserved; the two remaining architecture root causes were fixed:

1. **H1 TCC identity**: H1 freeze advances once to `sidedock-h1-freeze/2`; installer creates/reuses a persistent zero-cost self-signed Code Signing identity in a SideDock-dedicated keychain and signs `com.sidedock.desktop` with an explicit certificate-leaf + bundle-id Designated Requirement. Routine updates are Runtime-only and may not replace/re-sign `SideDock.app`.
2. **Browser Native false-health**: Native command-level health uses a short probe + bounded timeout/degraded window; Chrome Extension always keeps HTTP command long-poll hot even when Native is connected; Native/HTTP reuse the same requestId and Extension dedup gives exactly-once DOM-read semantics.

## Automated QA

- Regression: **130/130 PASS**
- JavaScript syntax: **348/348 PASS**
- Shell syntax: **23/23 PASS**
- JSON parse: **83/83 PASS**
- Manifest: **884/884 files valid, 0 mismatch**
- Release-root regression: **130/130 PASS**
- Fresh-extracted ZIP regression: **130/130 PASS**
- ZIP integrity: **PASS**
- Static safety: no screen-wide desktopCapturer, no executable CGEventPost/AX writes, no tccutil reset, no target-side compiler/toolchain installation.

## Real-Mac gates still pending

Do **not** call the release `FULLY_VERIFIED_ON_TARGET_MAC` until the user's target Mac proves:

- local H1 signing identity can be created/reused and `codesign` verifies the staged Host;
- one-time Screen Recording + Accessibility authorization becomes GRANTED after full quit/reopen;
- second v1.5.14 install is Runtime-only and preserves TCC without a new permission prompt;
- exact Activity Monitor/Terminal/Feishu pixels and Chrome single/dual-window isolation;
- Native-timeout -> HTTP hot fallback on live Chrome;
- ChatGPT attachment 20/20 ACK;
- outside-click 100/100, P95 <=250ms;
- >=50 unique pre-focus sessions/snapshots, zero wrong-window;
- no-full-display scope gate.

## Next action

On the target Mac: install v1.5.14 once -> authorize Screen Recording + Accessibility -> fully quit/reopen SideDock -> run the same installer a second time -> run `02_实机验收_SideDock_v1.5.14.command`.

Canonical release state and QA are stored under `releases/v1.5.14/` in this repository.