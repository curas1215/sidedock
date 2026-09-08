# SideDock TASK_STATE

Updated: 2026-09-08
Status: `CODE_VALIDATED_V1514_R3_REAL_MAC_PERMISSION_BROWSER_GATE_PENDING`
Release: `v1.5.14 R3`
Policy: NON_DEGRADABLE / NO_FABRICATED_PASS

## Latest real-Mac evidence

R2 now completed the target-Mac installer from `[1/9]` through `[9/9]` with `hostMigration=1`. The following live capture then failed with `RUNNING_HOST_IDENTITY_MISMATCH`.

The important evidence is that path, bundle ID, Host ABI/generation, Electron executable SHA, bootstrap SHA, HOST_ABI SHA and Host resources SHA all matched the installed receipt. Only the running `designatedRequirement` display parsed as empty, which caused `requirementMatch=false` and therefore `fingerprintMatch=false`.

The same capture also showed a Chrome binding false ambiguity: candidate A exactly matched the CGWindow bounds (IoU=1.000), while candidate B was shifted by 26 px (IoU about 0.966). In addition, the live Chrome heartbeat still reported `extensionVersion=1.5.13` after the R2 disk install.

## R3 closures

1. Running Host identity no longer trusts only `codesign -d -r-` display parsing. If the receipt contains a DR, R3 tests the CURRENT `SideDock.app` with real `codesign --verify --deep --strict -R =<receipt requirement>`. Only a successful verification can supply the receipt requirement to the Host fingerprint. Failure remains fail-closed.
2. Chrome binding now gives priority to the unique candidate whose x/y/width/height are all within 1 px of the exact target. If two candidates are both exact, the state remains AMBIGUOUS and SideDock does not guess.
3. The installer clean-stops SideDock's own Electron process immediately before atomic runtime/Host handoff, then starts the committed App. The matcher uses command-prefix matching and does not self-match a grep/awk helper.
4. Self-test and target-Mac Gate now require the LIVE Browser Adapter heartbeat to report `1.5.14`. If Chrome still holds the 1.5.13 service worker, the installer/self-test explicitly require one Chrome restart or unpacked-extension Reload.

## R3 automated / packaging QA

- Automated regression: **136/136 PASS**
- Active JavaScript syntax: **221/221 PASS**
- Active shell syntax: **6/6 PASS**
- Active JSON parse: **12/12 PASS**
- Static read-only/no-fullscreen/no-TCC-reset/no-user-compiler audit: **PASS**
- BUILD_MANIFEST: **1186 files, 0 mismatch**
- Fresh extracted final ZIP regression: **136/136 PASS**
- Fresh extracted final ZIP syntax: **221 JS / 6 Shell / 12 JSON PASS**
- Fresh extracted final static safety and executable-bit Gate: **PASS**
- ZIP integrity: **PASS**

Final R3 ZIP SHA256: `3d5fab8815d1e1761b2e427c8bd610b6012bab00134436fef6017bb1370f74d7`

## Real-Mac gates still pending

Do **not** call the release `FULLY_VERIFIED_ON_TARGET_MAC` until the user's target Mac proves:

- Running Host identity comparison is true after R3 restart;
- Accessibility + Screen Recording are actually GRANTED for the current H1 after one authorization and full quit/reopen;
- Chrome live heartbeat is extensionVersion 1.5.14;
- the reproduced two-window case binds the unique exact Browser Window instead of AMBIGUOUS;
- the second R3 install is Runtime-only and preserves Host/TCC identity with zero new permission prompt;
- live Native-stall -> HTTP hedge, Activity Monitor/Terminal/Feishu window pixels, no-full-display, ChatGPT attachment ACK, outside-click latency, input/IME/lifecycle and >=50 unique pre-focus gates pass.

## Next action

On the target Mac, install R3 directly without uninstalling. Let the installer stop/restart SideDock itself. Grant Accessibility + Screen Recording to the current `~/Applications/SideDock.app`, fully quit/reopen SideDock, then quit/reopen Chrome once (or Reload the unpacked SideDock extension). Retest the latest two-window case, run the same R3 installer a second time to prove Runtime-only continuity, then run `02_实机验收_SideDock_v1.5.14.command`.

Canonical R3 state and source delta are stored under `releases/v1.5.14-r3/`.
