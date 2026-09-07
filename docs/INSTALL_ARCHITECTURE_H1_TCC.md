# SideDock H1 Installation / TCC Architecture

Status: P0 release contract
Applies to: macOS releases after v1.5.13

## 1. Goal

macOS privacy authorization must belong to one stable, canonical SideDock Host identity. Updating business/runtime code must not silently create a new permission owner.

## 2. Two-layer installation model

### Layer A: Stable H1 Host

Canonical bundle:

`~/Applications/SideDock.app`

Responsibilities:

- owns macOS Screen Recording and Accessibility authorization
- owns the app bundle ID `com.sidedock.desktop`
- creates the non-activating panel / activation boundary
- exposes the stable Host API / ABI
- loads the versioned SideDock runtime
- performs authoritative permission checks

Release invariants:

- H1 host generation remains unchanged for normal runtime updates
- executable and permission-owning resources are immutable across runtime-only updates
- bundle ID remains unchanged
- canonical install path remains unchanged
- release build must have a non-empty stable designated requirement
- release build must have an expected Team Identifier
- installer must fail closed if release signing identity does not meet the manifest contract

### Layer B: Versioned Runtime Payload

Canonical root:

`~/Library/Application Support/SideDock/runtime/<version>`

Responsibilities:

- context engine
- Browser Adapter bridge
- target registry / resolver
- structured readers
- visual fallback routing
- diagnostics / UI business logic

Runtime update rules:

- stage new runtime side-by-side
- verify manifest and hashes before activation
- atomically switch active runtime pointer
- never replace/re-sign/mutate H1 Host during a normal runtime release
- rollback by switching runtime pointer, not by rewriting the Host bundle

## 3. Explicit Host-generation migration

A Host mutation is permitted only when a release explicitly increments `hostGeneration`.

Migration must:

1. quit all existing SideDock processes;
2. verify the old canonical Host identity;
3. install the new signed Host atomically;
4. record old/new designated requirements and hashes;
5. mark privacy authorization as `MIGRATION_REQUIRED` rather than assuming it survived;
6. guide the user through reauthorization where macOS requires it;
7. relaunch only the canonical Host;
8. perform authoritative post-grant checks;
9. require an exact-window capture proof before closing the migration gate.

## 4. Duplicate-app prevention

Before install and before launch, detect all visible SideDock bundles with bundle ID `com.sidedock.desktop` under at least:

- `~/Applications`
- `/Applications`
- mounted installer/temp locations when applicable

If more than one executable app copy can launch, block normal startup and show `DUPLICATE_HOST_IDENTITY` with the canonical path and duplicates.

Do not guess which copy the user authorized.

## 5. Permission state machine

The product must separate UI intent from OS truth.

States:

- `NOT_REQUESTED`
- `DENIED`
- `SETTINGS_OPENED`
- `USER_CONFIRMED_ENABLED`
- `RELAUNCH_REQUIRED`
- `TCC_GRANT_NOT_APPLIED`
- `GRANTED_PREFLIGHT`
- `GRANTED_CAPTURE_PROVEN`
- `MIGRATION_REQUIRED`
- `IDENTITY_MISMATCH`

Rules:

- `USER_CONFIRMED_ENABLED` is never equivalent to GRANTED.
- Screen Recording success requires authoritative OS preflight from the running H1 Host plus a real exact-window pixel capture proof.
- Accessibility success requires authoritative trust state from the running H1 Host.
- A settings round-trip made by one PID must be revalidated by the relaunched canonical Host.
- Never attempt screenshot capture when the authoritative gate is denied.

## 6. Permission recovery flow

When `TCC_GRANT_NOT_APPLIED` occurs:

1. show canonical SideDock path, bundle ID, Host generation, Team ID, designated requirement fingerprint;
2. detect duplicate app copies;
3. terminate stale SideDock Host processes;
4. offer an explicit user action to reset stale Screen Recording / Accessibility entries when needed;
5. reopen the relevant macOS privacy panels;
6. instruct the user to authorize the canonical app only;
7. fully quit/relaunch the canonical Host;
8. verify OS truth again;
9. run one exact-window capture proof against a known external target;
10. persist an authorization receipt only after the proof succeeds.

The product must not claim a permission fix until step 10.

## 7. Authorization receipt contract

Persist after successful proof:

```json
{
  "contract": "sidedock-h1-authorization/2",
  "hostGeneration": "H1",
  "hostAbi": 1,
  "bundleId": "com.sidedock.desktop",
  "canonicalAppPath": "~/Applications/SideDock.app",
  "teamIdentifier": "...",
  "designatedRequirementHash": "...",
  "hostFingerprint": "...",
  "screenPreflightGranted": true,
  "accessibilityGranted": true,
  "captureProof": {
    "targetWindowId": 0,
    "sourceWindowId": 0,
    "scope": "EXACT_WINDOW",
    "imageBytes": 0,
    "imageHash": "..."
  },
  "authorizedAt": 0
}
```

Receipt invalidation triggers:

- Host generation changes
- designated requirement changes
- Team ID changes
- bundle ID changes
- canonical path policy changes
- Host fingerprint changes unexpectedly for H1

## 8. Installer gates

Installer must fail before launch when any of these are false:

- canonical destination is writable
- bundle ID is correct
- Host generation / ABI match manifest
- designated requirement exists
- Team ID matches release manifest
- Host file hashes match release manifest
- runtime payload manifest/hashes pass
- no ambiguous duplicate launchable Host exists

Installer must write a machine-readable install receipt.

## 9. Browser Adapter latency closure

The Browser Adapter command path must maintain a live transport-health record separate from heartbeat metadata.

Required behavior:

- Chrome heartbeat proves target metadata freshness only; it does not prove the capture command channel is healthy.
- native-messaging command health and HTTP fallback health are tracked separately.
- if native transport is already known unhealthy, skip directly to HTTP fallback.
- if native transport becomes unavailable during a request, fail over within a bounded short deadline rather than waiting the current multi-second timeout.
- the same `requestId` is used across failover and readers must remain idempotent.
- if both structured transports fail, route to exact-window visual fallback without whole-screen downgrade.

## 10. Release acceptance

A candidate cannot be called verified until real macOS proves:

1. canonical H1 Host identity is stable;
2. Screen Recording and Accessibility are actually granted to that Host;
3. exact-window visual capture succeeds and sourceWindowId == targetWindowId;
4. duplicate copies are detected/blocking;
5. normal runtime update does not revoke permissions;
6. rollback does not mutate the Host;
7. Browser Adapter native path works;
8. native failure -> HTTP or visual fallback is bounded and idempotent;
9. Terminal / Activity Monitor / Feishu / Chrome current-window paths pass;
10. no whole-display capture path is introduced.