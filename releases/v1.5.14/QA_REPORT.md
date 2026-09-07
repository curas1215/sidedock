# SideDock v1.5.14 H1 Stable TCC + Browser Hot-Standby QA REPORT

## Release status

`CODE_VALIDATED_REAL_MAC_V1514_STABLE_TCC_GATE_PENDING`

This package is **not** labeled `FULLY_VERIFIED_ON_TARGET_MAC`. The code-side/install-architecture root causes identified from the v1.5.13 real-Mac evidence are closed and automated QA passes, but macOS TCC, WindowServer and live Chrome/ChatGPT evidence can only be produced by the target Mac.

## Why v1.5.14 exists

The v1.5.13 real-Mac evidence already showed that the external concrete window was being resolved correctly: the request target, CGWindowID/bounds and PreActivationSession could align. The remaining failures were later in the chain:

1. H1 still ended in `TCC_GRANT_NOT_APPLIED`/Screen+AX denied after the user returned from System Settings.
2. Browser Adapter Native Messaging could be `connected` while command round-trip timed out; the old Extension stopped its HTTP command long-poll whenever Native looked connected, so Desktop's fallback was not actually hot.

v1.5.14 fixes those two architecture defects without rewriting the already-passing window resolver.

## P0 closure 1 — stable H1 privacy identity

- Host ABI remains `1`, generation remains `H1`.
- Freeze contract advances once from `sidedock-h1-freeze/1` to `sidedock-h1-freeze/2` because the signing identity changes.
- Installer creates/reuses `~/Library/Application Support/SideDock/Signing/SideDock-H1.keychain-db`.
- H1 is signed with a persistent self-signed Code Signing certificate and explicit DR: `certificate leaf = H"<persistent SHA1>" and identifier "com.sidedock.desktop"`.
- Installer hard-fails empty DR, `cdhash` DR, wrong bundle identity, ad-hoc signature or missing authority.
- After `/2`, routine updates are Runtime-only and verify the whole `SideDock.app` tree/DR before and after.
- Normal uninstall does not execute `tccutil reset` and preserves the local H1 signing identity.
- Runtime exposes `HOST_IDENTITY_MISMATCH` and `HOST_SIGNING_IDENTITY_UNSTABLE`; permission blockers stop before any pixel backend invocation.

## P0 closure 2 — Browser Native connected-but-dead channel

- Native command health is measured at command level, not by Port `connected`.
- Health probe: 450ms; Native capture budget <=1200ms.
- Timeout creates a short degraded window; later requests fast-fail Native and immediately use fallback.
- Chrome Extension always keeps one localhost `/v1/browser-command/next` long-poll active even while Native Messaging is connected; the poll reads zero DOM.
- Native and HTTP use the same requestId; Extension request cache deduplicates the running promise/result, preserving exactly-once DOM reads.

## Preserved P0 behavior

Pre-focus target identity, Chrome multi-window binding, thin-strip rejection, exact-first WindowID capture, no automatic full-screen capture, Terminal/Activity Monitor/Feishu visual escalation, attachment Preview+Upload Ready+ACK, outside-click priority, IME/typing idle protection and external-app read-only rules are preserved.

## Automated regression

- **130 / 130 PASS**
- **0 FAIL**

New v1.5.14 gates cover stable H1 signing/DR installer contract, Browser HTTP hot standby, shared requestId failover, Native command health/degradation and the stronger non-fabricable target-Mac Gate.

## Static / syntax QA

- JavaScript syntax: **348 / 348 PASS**
- shell syntax: **23 / 23 PASS**
- JSON parse: **83 / 83 PASS**
- screen-wide `desktopCapturer`: **0**
- executable `CGEventPost`: **0**
- executable `AXUIElementPerformAction`: **0**
- executable `AXUIElementSetAttributeValue`: **0**
- executable `tccutil reset`: **0**
- installer/user-side compiler/toolchain install calls: **0**

## Stronger target-Mac Gate

`02_实机验收_SideDock_v1.5.14.command` directly checks persistent signing identity fingerprint, `codesign --verify --deep --strict`, live DR, signing authority, non-ad-hoc signature, current frozen Host tree hash, H1 authorization fingerprint and second-install Runtime-only continuity before functional gates.

## Final delivery packaging validation

The frozen delivery root and a fresh extraction of the ZIP were both independently validated:

- BUILD_MANIFEST entries: **884**, hash/size mismatches: **0**;
- release-root automated regression: **130/130 PASS**;
- extracted-ZIP automated regression: **130/130 PASS**;
- extracted-ZIP JavaScript syntax: **348/348 PASS**;
- extracted-ZIP shell syntax: **23/23 PASS**;
- extracted-ZIP JSON parse: **83/83 PASS**;
- ZIP integrity: **PASS**;
- manifest re-check after extracted-tree tests: **0 mismatches**.

## Target-Mac evidence still required

The following cannot be truthfully marked PASS from the Linux build environment:

1. macOS creates/reuses the local H1 signing identity and `codesign` accepts the staged Host.
2. Migrated `/2` H1 receives Screen Recording + Accessibility once and reports both GRANTED after full quit/reopen.
3. Second v1.5.14 install is Runtime-only, leaves `SideDock.app` unchanged and requires no new TCC authorization.
4. Live WindowServer returns exact Activity Monitor/Terminal/Feishu target pixels.
5. Live Chrome demonstrates Native-timeout -> HTTP hot fallback and dual-window isolation.
6. ChatGPT attachment ACK 20/20.
7. Outside-click 100/100 with P95 <=250ms.
8. >=50 unique pre-focus sessions/snapshots with zero wrong-window.
9. No-full-display scope gate.

Only after those pass may status become `FULLY_VERIFIED_ON_TARGET_MAC`; no target-Mac PASS is fabricated here.
