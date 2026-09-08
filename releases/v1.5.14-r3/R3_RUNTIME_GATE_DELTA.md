# v1.5.14 R3 runtime / real-Mac Gate delta

The full frozen delivery/source archive is identified by the R3 artifact hashes. The exact new core source files are stored under this release directory. These are the additional canonical deltas to R2.

## `desktop/app/src/diagnostics/self-test.js`

After BrowserTargetRegistry diagnostics are read:

```js
const browserDiag=this.browserTargetRegistry?.diagnostics?.()||{};
const loadedExtensionVersion=String(browserDiag.extensionVersion||'');
items.push(loadedExtensionVersion==='1.5.14'
  ? item('BROWSER_ADAPTER_VERSION','PASS',`Browser Adapter ${loadedExtensionVersion} loaded.`,{browserDiag})
  : item('BROWSER_ADAPTER_VERSION','FAIL',loadedExtensionVersion?`Browser Adapter ${loadedExtensionVersion} is still loaded; quit/reopen Chrome once or reload the unpacked extension so v1.5.14 code is active.`:'Browser Adapter is not connected; Chrome v1.5.14 extension must be loaded for the full browser release gate.',{browserDiag}));
```

## `desktop/verify_mac_smoke.command`

`BROWSER_ADAPTER_VERSION` is a required smoke item and must be PASS:

```bash
REQUIRED_IDS=(LIVE_EXTERNAL_TARGET REQUEST_TARGET REQUEST_TARGET_ISOLATION PREACTIVATION_SESSION NONACTIVATING_PANEL_PREFOCUS WINDOW_SCOPED_VISUAL NO_FULL_DISPLAY_GUARD TARGET_ERRORS_DO_NOT_GATE_VISION BROWSER_ADAPTER_VERSION CONTEXT_CAPTURE VISION_CAPABILITY_PROBE VISION_WINDOW_MATCH CHATGPT_SESSION)
/usr/bin/grep -A4 -F '"id": "BROWSER_ADAPTER_VERSION"' "$REPORT" | /usr/bin/grep -Fq '"status": "PASS"' || fail "Browser Adapter v1.5.14 is not loaded. Quit/reopen Chrome once (or reload the unpacked SideDock extension), rerun self-test, then rerun this gate." 6
```

## Installer handoff

See `source/desktop/install-r3-process-handoff.snippet.command`. It is applied immediately before `COMMIT_STARTED=1`, so a live old SideDock process cannot survive the runtime/receipt handoff.

## R3 regression guards

- `test_v1514_r3_running_host_identity.js`
- `test_v1514_r3_chrome_exact_geometry.js`
- `test_v1514_r3_installer_process_handoff.js`
- `test_v1514_r3_extension_reload_gate.js`

Final suite result: 136/136 PASS.
