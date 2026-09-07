# SideDock v1.5.14 R2

## Real-Mac failure closed by R2

The first v1.5.14 installer reached `[2/9] Preparing immutable Permission Host` and failed with:

`codesign Requirement syntax error: unexpected token: designated`

The failure was in the installer requirement-verification syntax, not in the user's macOS permission choices. The installer reused a typed internal requirement set beginning with `designated =>` for `codesign -R`, but `-R` expects a single untyped requirement expression.

R2 separates the two roles:

- `HOST_STABLE_REQUIREMENT`: typed requirement set, retained for `codesign --requirements` when signing.
- `HOST_STABLE_TEST_REQUIREMENT`: untyped expression, used for every `codesign -R` verification.

A dedicated regression test forbids the old `-R "=$HOST_STABLE_REQUIREMENT"` form.

The reported failure occurred before the Atomic Commit phase, so this failure path did not intentionally replace the existing installed Host.

## R2 validation

- Automated regression: **132/132 PASS**
- Active JavaScript syntax: **217/217 PASS**
- Active shell syntax: **6/6 PASS**
- Active JSON parse: **11/11 PASS**
- Manifest: **1161 files, 0 mismatches**
- ZIP integrity / reverse-extract regression: **PASS**
- Static read-only / no TCC reset / no user compiler: **PASS**

## Truth status

`CODE_VALIDATED_V1514_R2_REAL_MAC_TCC_WINDOW_GATE_PENDING`

R2 still requires target-Mac evidence for TCC, WindowServer, live Chrome/ChatGPT, second-install Host continuity, and final interaction gates. Those results are not fabricated by the build environment.
