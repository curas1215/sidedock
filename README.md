# SideDock

SideDock is the macOS desktop context assistant project.

## Current recovery baseline

- Real-Mac runtime observed: `v1.5.13`
- Host generation: `H1`
- Canonical app path: `~/Applications/SideDock.app`
- Canonical runtime path: `~/Library/Application Support/SideDock/runtime/1.5.13`
- Latest real blocker: macOS TCC grants are not applied to the running H1 host (`TCC_GRANT_NOT_APPLIED`).
- Concrete-window targeting is no longer the blocker: latest evidence shows exact Chrome CGWindow/Browser Window binding.

## Release policy

No requirement downgrade and no fabricated PASS. A release is fully verified only after the real-Mac permission gate, exact-window visual fallback, browser/desktop paths, interaction lifecycle and final QA all pass.

## Persistence policy

All future SideDock source, TASK_STATE, QA state, release manifests and recovery checkpoints belong in this repository. Runtime updates must preserve the stable H1 host identity unless an explicit host-generation migration is required.
