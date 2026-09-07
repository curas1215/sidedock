# SideDock TASK_STATE

Updated: 2026-09-07
Status: RECOVERY_IN_PROGRESS
Release target: next version after v1.5.13
Policy: NON_DEGRADABLE

## Last verified runtime

- Version: 1.5.13
- Host generation: H1
- Host ABI: 1
- Canonical app: `~/Applications/SideDock.app`
- Runtime: `~/Library/Application Support/SideDock/runtime/1.5.13`
- Bundle ID: `com.sidedock.desktop`

## Verified PASS from latest real-Mac trace

1. Pre-activation target session exists and is authoritative.
2. Google Chrome concrete target resolved by exact CGWindow match.
3. CGWindow ID: 210785.
4. Browser Window -> CGWindow binding is EXACT.
5. Browser bounds IoU = 1; ambiguity gap = 1; confidence = 1.
6. Thin/non-content Chrome strip windows are rejected.
7. Structured-reader failure routes to window-scoped visual fallback.
8. Visual fallback is eligible for the current-window request.
9. No whole-screen downgrade is allowed.

Do not reimplement these unless affected by the fixes below.

## Current P0 blockers

### P0-1 macOS TCC grant not applied

Observed terminal code: `TCC_GRANT_NOT_APPLIED`.

The user completed a privacy-settings round trip and confirmed enablement, but the running H1 host still observes:

- Screen Recording: DENIED
- Accessibility: DENIED
- pixel capture allowed: false
- AX read allowed: false
- H1 authorization: false

The running host matches the installed host fingerprint, so this is no longer a target-resolution problem.

Release requirement: do not mark permission success from UI confirmation. Success requires an OS-level preflight/real capture proof after the canonical host relaunches.

### P0-2 unstable release signing identity

Latest runtime reports:

- code signing identifier: `com.sidedock.desktop`
- designated requirement: empty
- team identifier: not set

The release architecture must provide a stable signed H1 host identity. Runtime upgrades must not mutate the permission-owning host executable/resources unless an explicit host-generation migration is performed.

### P0-3 Browser Adapter native messaging timeout

Latest exact Chrome target still encountered `BROWSER_ADAPTER_TIMEOUT` after about 3.62s before falling back to vision.

Required closure:

- proactive command-channel health state
- native/HTTP failover without duplicated reads
- bounded failover latency
- requestId idempotency preserved
- do not wait several seconds when the native channel is already known unavailable

### P0-4 Real-Mac final gate

Must prove after P0-1/P0-2/P0-3:

- Screen Recording enabled for the actual running canonical host
- Accessibility enabled for the actual running canonical host
- exact-window screenshot succeeds
- image source window ID matches target window ID
- no whole-screen capture
- Terminal / Activity Monitor / Feishu / Chrome fallback paths work
- hover/input/retract lifecycle is unchanged
- Browser Adapter command path and fallback path both pass

## Source availability blocker

The connected File Library currently exposes diagnostics/build metadata and historical artifacts, but not the full v1.5.13 source/install archive. The GitHub repository was empty before this recovery checkpoint.

Therefore no source-level implementation should be claimed until the canonical v1.5.13 source baseline is imported into this repository.

## Next execution sequence

1. Import canonical v1.5.13 source/install baseline to this repository.
2. Freeze/sign H1 host architecture and installer invariants.
3. Implement TCC migration/recovery UX and authoritative post-grant verification.
4. Fix Browser Adapter command-channel health/failover latency.
5. Run targeted automated tests for changed domains.
6. Run affected-domain regression.
7. Build macOS candidate and execute real-Mac permission + exact-window smoke tests.
8. Run one final full regression + final QA.
9. Persist QA_REPORT, BUILD_MANIFEST, hashes, release ZIP and updated TASK_STATE.

No blocked item may be labeled PASS.