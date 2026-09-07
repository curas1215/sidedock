# SideDock

SideDock is the macOS desktop context assistant project.

## Current release candidate

- Version: `v1.5.14`
- Status: `CODE_VALIDATED_REAL_MAC_V1514_STABLE_TCC_GATE_PENDING`
- Host generation / ABI: `H1 / 1`
- Freeze contract: `sidedock-h1-freeze/2`
- Canonical app: `~/Applications/SideDock.app`
- Runtime: `~/Library/Application Support/SideDock/runtime/1.5.14`
- Signing profile: `LOCAL_SELF_SIGNED_H1_V1`
- Designated Requirement contract: `CERT_LEAF_SHA1_AND_IDENTIFIER_V1`

## v1.5.14 architecture closure

The v1.5.13 real-Mac evidence already proved concrete-window targeting could resolve the correct Chrome/desktop window, so v1.5.14 does not reimplement that path. It closes the remaining P0 blockers:

- persistent local Code Signing identity + explicit stable DR for the H1 macOS privacy/TCC owner;
- immutable `SideDock.app` after one explicit `/1 -> /2` signing migration;
- command-level Native Messaging health instead of trusting Port `connected`;
- HTTP browser-command hot standby always armed;
- shared requestId dedup across Native/HTTP to avoid duplicate DOM reads;
- stronger target-Mac smoke gate that verifies live codesign/DR/authority/app-tree identity.

## Validation

The final source tree, final delivery root, and a fresh extraction of the ZIP were validated. Automated regression is `130/130 PASS`; JS/shell/JSON validation is `348/348`, `23/23`, `83/83`; BUILD_MANIFEST has 884 entries with zero hash mismatch.

The release is **not** marked fully verified on target Mac until real TCC, WindowServer, live Chrome/ChatGPT and interaction gates pass.

## Persistence policy

All SideDock source changes, TASK_STATE, QA state, release manifests and recovery checkpoints belong in this repository. Runtime updates must preserve the stable H1 host identity unless an explicit host-generation/freeze migration is required. No requirement downgrade and no fabricated PASS.