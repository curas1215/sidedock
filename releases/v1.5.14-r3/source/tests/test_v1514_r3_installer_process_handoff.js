const fs=require('fs'); const path=require('path'); const assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../desktop/install.command'),'utf8');
assert(src.includes('stop_running_sidedock'));
assert(src.includes('/bin/kill -TERM'));
assert(src.includes('case "$command" in'));
assert(!src.includes('awk -v needle="$TARGET_APP/Contents/MacOS/Electron"')); // never match the matcher itself
assert(src.indexOf('stop_running_sidedock') < src.indexOf("printf '[6/9] Atomic commit"));
assert(src.includes('INSTALLER_REVISION="R3"'));
console.log('PASS v1.5.14 R3 installer clean process handoff');
