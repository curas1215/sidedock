# SideDock v1.5.14 source sync

This directory records the final v1.5.14 source/release provenance produced from the user-supplied v1.5.13 H1 delivery baseline.

## Final artifacts

- Final install ZIP: `SideDock_v1.5.14_H1稳定权限身份_350ms浏览器容错_零成本_全问题优化交付包_MAC_INSTALL_KIT.zip`
- Final ZIP SHA256: `fb8d9917739a2fe5c93432094d9bfdf76f9076e7cb293045891e66e5d08c445c`
- Source archive SHA256: `9cde7474372bb80d6ebb2f399eb32ebd3cecfe95dd57e0228080cef32d499d92`
- Core v1.5.13 -> v1.5.14 patch SHA256: `446ad0771a3f47728436a948deb8edd066554ebb50b0898a9fd9c856b1fb5f03`
- Final source-tree SHA256 recorded by BUILD_MANIFEST: `5c862c158c0f6978e9c441bd224345fbc4a77ccf1aa8fdec42aa6fa2c262efee`
- Final BUILD_MANIFEST SHA256: `01b458fbf81c2e70c2c0e5a51f25505497070253f85b1cccc7dfe9287bcafb49`

## Core files changed

- `desktop/install.command`
- `desktop/app/src/main.js`
- `desktop/app/src/bridge/native-server.js`
- `desktop/app/src/context/running-host-identity.js`
- `chrome_extension/background.js`
- delivery/version wrappers, receipts, release gate and Mac verification scripts

## New v1.5.14 tests

- `tests/test_v1514_stable_h1_identity_repair.js`
- `tests/test_v1514_browser_transport_hedge.js`
- `tests/test_v1514_native_command_circuit.js`
- `tests/test_v1514_delivery_version_contract.js`

## Closed code-level P0s

1. Weak H1/TCC identity: one-time weak-H1 repair, explicit stable custom Designated Requirement, literal requirement `=` prefix, `codesign -R` verification, and immutable routine Runtime-only updates.
2. Native connected-but-stalled: always-armed localhost HTTP command long-poll, 350ms Native-first hedge, shared requestId dedup, command-level health, 5s circuit breaker, bounded Native timeout.

## QA truth boundary

Automated/source/package verification is PASS. Real macOS TCC, WindowServer and live Chrome/ChatGPT acceptance remains a target-Mac evidence gate and is intentionally not fabricated as PASS.

The final install ZIP contains the complete delivery tree, v1.5.14 checkpoint/source snapshot, tests, QA logs and BUILD_MANIFEST. The repository release records preserve the state, QA, architecture contract and source-change provenance for continuation.
