const fs=require('fs'); const path=require('path'); const assert=require('assert');
const root=path.join(__dirname,'..');
const self=fs.readFileSync(path.join(root,'desktop/app/src/diagnostics/self-test.js'),'utf8');
const verify=fs.readFileSync(path.join(root,'desktop/verify_mac_smoke.command'),'utf8');
const install=fs.readFileSync(path.join(root,'desktop/install.command'),'utf8');
assert(self.includes("BROWSER_ADAPTER_VERSION")); assert(self.includes("loadedExtensionVersion==='1.5.14'"));
assert(verify.includes('BROWSER_ADAPTER_VERSION')); assert(install.includes('quit/reopen Chrome once'));
console.log('PASS v1.5.14 R3 loaded Browser Adapter version gate');
