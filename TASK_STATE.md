# SideDock TASK_STATE

Updated: 2026-09-08
Status: `CODE_VALIDATED_V1514_R2_REAL_MAC_TCC_WINDOW_GATE_PENDING`
Release: `v1.5.14 R2`
Policy: NON_DEGRADABLE / NO_FABRICATED_PASS

## Latest real-Mac evidence

The first v1.5.14 installer reached `[2/9] Preparing immutable Permission Host` and failed before Atomic Commit with:

`codesign Requirement syntax error: unexpected token: designated`

Root cause: the typed internal requirement set beginning with `designated =>` was correctly suitable for `codesign --requirements` during signing, but was incorrectly reused for `codesign -R`, which expects one untyped test expression.

## R2 closure

R2 splits the requirement roles:

1. `HOST_STABLE_REQUIREMENT` retains `designated =>` and is used only for signing/embedding the requirement set.
2. `HOST_STABLE_TEST_REQUIREMENT` omits `designated =>` and is used by every `codesign -R` verification.
3. A regression guard explicitly forbids the old invalid `-R "=$HOST_STABLE_REQUIREMENT"` form.
4. The real-Mac failure occurred before Atomic Commit, so this failed path did not intentionally replace the existing installed Host.

The prior v1.5.14 architecture fixes remain preserved: exact-window/PreActivationSession targeting, H1 Host/Runtime separation, Browser HTTP hot standby, same-requestId Native/HTTP dedup, 350ms hedge and degraded Native fast-fail behavior.

## R2 automated QA

- Automated regression: **132/132 PASS**
- Active JavaScript syntax: **217/217 PASS**
- Active shell syntax: **6/6 PASS**
- Active JSON parse: **11/11 PASS**
- Manifest: **1161 files, 0 mismatch**
- Fresh extracted ZIP regression: **132/132 PASS**
- ZIP integrity: **PASS**
- Static safety/read-only/no TCC reset/no user compiler: **PASS**

ZIP SHA256: `de1f502eb3d056d62f34e082b02c116265e611bf8cd0de0d204f24023606aba5`
BUILD_MANIFEST SHA256: `5d190192c7fcbd49eeedafd46678b9d06921dafe80fef67ca6e95d5987a7a817`

## Real-Mac gates still pending

Do **not** call the release `FULLY_VERIFIED_ON_TARGET_MAC` until the user's target Mac proves:

- R2 passes the corrected staged/final Host `codesign -R` checks;
- Screen Recording + Accessibility become GRANTED for the actual running H1 after any required one-time authorization and full quit/reopen;
- second R2 install is Runtime-only and preserves Host/TCC identity;
- exact Activity Monitor/Terminal/Feishu pixels with no wrong/full-display capture;
- live Chrome Native-timeout -> HTTP hot fallback and single/dual-window isolation;
- ChatGPT attachment ACK gate;
- outside-click latency gate;
- unique pre-focus session/snapshot gate.

## Next action

Do not retry the original v1.5.14 package. On the target Mac, run the R2 package's `01_安装_SideDock_v1.5.14.command`. If installation reaches `[9/9]`, complete any one-time macOS privacy authorization, fully quit/reopen SideDock, run the R2 installer a second time to prove Runtime-only continuity, then run `02_实机验收_SideDock_v1.5.14.command`.

Canonical R2 state, patch, test and final verification are stored under `releases/v1.5.14-r2/`.
