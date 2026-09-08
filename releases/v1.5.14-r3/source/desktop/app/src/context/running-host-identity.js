const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');

function clone(v) { return v ? JSON.parse(JSON.stringify(v)) : v; }
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function sha256File(file) {
  try { const h = crypto.createHash('sha256'); h.update(fs.readFileSync(file)); return h.digest('hex'); } catch { return ''; }
}
function sha256Text(text) { return crypto.createHash('sha256').update(String(text || '')).digest('hex'); }
function normalizeRequirement(text) { return String(text || '').trim().replace(/\s+/g, ' '); }
function parseDesignatedRequirement(...parts) {
  const text = parts.map((x) => String(x || '')).filter(Boolean).join('\n');
  const match = text.match(/(?:^|\r?\n)\s*designated\s*=>\s*([^\r\n]+)/i);
  return normalizeRequirement(match?.[1] || '');
}

function sha256Directory(root) {
  // Must be byte-for-byte compatible with install.command tree_fingerprint().
  // The frozen Host receipt and the running Host identity must compute the
  // same value or TCC identity diagnostics would falsely report a mismatch.
  try {
    const files=[]; const links=[];
    const walk=(dir)=>{
      for(const name of fs.readdirSync(dir).sort()){
        const full=path.join(dir,name); const st=fs.lstatSync(full);
        if(st.isDirectory()) walk(full);
        else if(st.isFile()) files.push(full);
        else if(st.isSymbolicLink()) links.push(full);
      }
    };
    walk(root);
    const rows=[];
    for(const full of files.sort()){
      const rel=`./${path.relative(root,full).split(path.sep).join('/')}`;
      rows.push(`F ${sha256File(full)} ${rel}\n`);
    }
    for(const full of links.sort()){
      const rel=`./${path.relative(root,full).split(path.sep).join('/')}`;
      rows.push(`L ${fs.readlinkSync(full)} ${rel}\n`);
    }
    return crypto.createHash('sha256').update(rows.join('')).digest('hex');
  } catch { return ''; }
}

function realpath(file) { try { return fs.realpathSync(file); } catch { return path.resolve(String(file || '')); } }
function deriveAppBundlePath(execPath = process.execPath) {
  const value = realpath(execPath);
  const marker = `${path.sep}Contents${path.sep}MacOS${path.sep}`;
  const at = value.lastIndexOf(marker);
  return at > 0 ? value.slice(0, at) : '';
}
function run(file, args, timeout = 1500) {
  return new Promise((resolve) => execFile(file, args, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => resolve({ error, stdout:String(stdout || ''), stderr:String(stderr || '') })));
}
function parseCodesign(stderr = '') {
  const text = String(stderr || '');
  const identifier = (text.match(/^Identifier=(.+)$/m) || [])[1] || '';
  const cdHash = (text.match(/^CDHash=(.+)$/m) || [])[1] || '';
  const teamIdentifier = (text.match(/^TeamIdentifier=(.+)$/m) || [])[1] || '';
  return { identifier:identifier.trim(), cdHash:cdHash.trim(), teamIdentifier:teamIdentifier.trim() };
}
function compareInstalledIdentity(current = {}, receipt = {}) {
  const receiptPath = String(receipt.canonicalAppPath || receipt.appBundlePath || '');
  const pathMatch = !receiptPath || realpath(receiptPath) === realpath(current.appBundlePath || '');
  const bundleMatch = !receipt.bundleId || String(receipt.bundleId) === String(current.bundleId || '');
  const abiMatch = !receipt.hostAbi || Number(receipt.hostAbi) === Number(current.hostAbi || 0);
  const generationMatch = !receipt.hostGeneration || String(receipt.hostGeneration) === String(current.hostGeneration || '');
  const bootstrapMatch = !receipt.bootstrapSha256 || String(receipt.bootstrapSha256) === String(current.bootstrapSha256 || '');
  const hostResourcesMatch = !receipt.hostResourcesSha256 || String(receipt.hostResourcesSha256) === String(current.hostResourcesSha256 || '');
  const executableMatch = !receipt.executableSha256 || String(receipt.executableSha256) === String(current.executableSha256 || '');
  const requirementMatch = !receipt.designatedRequirement || String(receipt.designatedRequirement) === String(current.designatedRequirement || '');
  const fingerprintMatch = !receipt.hostFingerprint || String(receipt.hostFingerprint) === String(current.hostFingerprint || '');
  const same = pathMatch && bundleMatch && abiMatch && generationMatch && bootstrapMatch && hostResourcesMatch && executableMatch && requirementMatch && fingerprintMatch;
  return { same, pathMatch, bundleMatch, abiMatch, generationMatch, bootstrapMatch, hostResourcesMatch, executableMatch, requirementMatch, fingerprintMatch };
}

class RunningHostIdentityService {
  constructor({ supportRoot = '', execPathProvider = () => process.execPath, pidProvider = () => process.pid, ppidProvider = () => process.ppid, platform = process.platform, runCommand = run } = {}) {
    this.supportRoot = supportRoot || process.env.SIDEDOCK_SUPPORT_ROOT || path.join(os.homedir(), 'Library', 'Application Support', 'SideDock');
    this.execPathProvider = execPathProvider;
    this.pidProvider = pidProvider;
    this.ppidProvider = ppidProvider;
    this.platform = platform;
    this.runCommand = runCommand;
    this.last = null;
  }

  receipt() {
    return readJson(path.join(this.supportRoot, 'HOST_RECEIPT.json')) || readJson(path.join(this.supportRoot, 'INSTALL_RECEIPT_v1514.json')) || readJson(path.join(this.supportRoot, 'INSTALL_RECEIPT_v1513.json')) || readJson(path.join(this.supportRoot, 'INSTALL_RECEIPT_v1512.json')) || {};
  }
  runtimePointer() { return readJson(path.join(this.supportRoot, 'active-runtime.json')) || {}; }

  async snapshot() {
    const execPath = realpath(this.execPathProvider());
    const appBundlePath = deriveAppBundlePath(execPath);
    const hostAppRoot = appBundlePath ? path.join(appBundlePath, 'Contents', 'Resources', 'app') : '';
    const abi = readJson(hostAppRoot ? path.join(hostAppRoot, 'HOST_ABI.json') : '') || {};
    const active = this.runtimePointer();
    const receipt = this.receipt();
    let designatedRequirement = '';
    let designatedRequirementSource = '';
    let designatedRequirementVerified = false;
    let designatedRequirementError = '';
    let codeSigningIdentifier = '';
    let cdHash = '';
    let teamIdentifier = '';
    if (this.platform === 'darwin' && appBundlePath) {
      const req = await this.runCommand('/usr/bin/codesign', ['-d', '-r-', appBundlePath]);
      const displayedRequirement = parseDesignatedRequirement(req.stderr, req.stdout);
      const receiptRequirement = String(receipt.designatedRequirement || '').trim();
      designatedRequirement = displayedRequirement;
      designatedRequirementSource = displayedRequirement ? 'codesign_display' : '';
      if (receiptRequirement) {
        const verify = await this.runCommand('/usr/bin/codesign', ['--verify', '--deep', '--strict', '-R', `=${receiptRequirement}`, appBundlePath], 2500);
        if (!verify.error) {
          designatedRequirement = receiptRequirement;
          designatedRequirementSource = displayedRequirement ? 'codesign_display_receipt_verified' : 'receipt_verified_expression';
          designatedRequirementVerified = true;
        } else {
          designatedRequirementError = String(verify.stderr || verify.stdout || verify.error?.message || verify.error || '').trim().slice(0, 500);
        }
      } else if (displayedRequirement) {
        designatedRequirementVerified = true;
      }
      const detail = await this.runCommand('/usr/bin/codesign', ['-dv', '--verbose=4', appBundlePath]);
      const parsed = parseCodesign(`${detail.stderr || ''}\n${detail.stdout || ''}`);
      codeSigningIdentifier = parsed.identifier; cdHash = parsed.cdHash; teamIdentifier = parsed.teamIdentifier;
    }
    const bootstrapPath = hostAppRoot ? path.join(hostAppRoot, 'bootstrap.js') : '';
    const abiPath = hostAppRoot ? path.join(hostAppRoot, 'HOST_ABI.json') : '';
    const executableSha256 = sha256File(execPath);
    const bootstrapSha256 = sha256File(bootstrapPath);
    const hostAbiSha256 = sha256File(abiPath);
    const hostResourcesSha256 = hostAppRoot ? sha256Directory(hostAppRoot) : '';
    const hostFingerprint = sha256Text(JSON.stringify({
      appBundlePath:realpath(appBundlePath || ''), bundleId:String(abi.bundleId || 'com.sidedock.desktop'), hostAbi:Number(abi.hostAbi || process.env.SIDEDOCK_HOST_ABI || 0), hostGeneration:String(abi.hostGeneration || process.env.SIDEDOCK_HOST_GENERATION || ''), freezeContract:String(abi.freezeContract || ''), executableSha256, bootstrapSha256, hostAbiSha256, hostResourcesSha256, designatedRequirement
    }));
    const current = {
      pid:Number(this.pidProvider() || 0), ppid:Number(this.ppidProvider() || 0), execPath, appBundlePath:realpath(appBundlePath || ''),
      bundleId:String(abi.bundleId || 'com.sidedock.desktop'), hostAbi:Number(abi.hostAbi || process.env.SIDEDOCK_HOST_ABI || 0), hostGeneration:String(abi.hostGeneration || process.env.SIDEDOCK_HOST_GENERATION || ''), freezeContract:String(abi.freezeContract || ''),
      runtimeVersion:String(process.env.SIDEDOCK_RUNTIME_VERSION || active.version || ''), runtimePath:String(process.env.SIDEDOCK_RUNTIME_ROOT || active.runtimePath || ''),
      executableSha256, bootstrapSha256, hostAbiSha256, hostResourcesSha256, codeSigningIdentifier, designatedRequirement:String(designatedRequirement || '').trim(), designatedRequirementSource, designatedRequirementVerified, designatedRequirementError, cdHash, teamIdentifier, hostFingerprint,
      capturedAt:Date.now()
    };
    const comparison = compareInstalledIdentity(current, receipt);
    this.last = { ...current, installedHostFingerprint:String(receipt.hostFingerprint || ''), installedCanonicalAppPath:String(receipt.canonicalAppPath || receipt.appBundlePath || ''), installedAppTreeSha256:String(receipt.appTreeSha256 || ''), hostFrozen:Boolean(receipt.hostFrozen || receipt.hostGeneration==='H1'), sameAsInstalledHost:comparison.same, identityComparison:comparison, receiptContract:String(receipt.contract || '') };
    return clone(this.last);
  }
  getSnapshot() { return clone(this.last); }
}

module.exports = { RunningHostIdentityService, deriveAppBundlePath, compareInstalledIdentity, sha256File, sha256Text, sha256Directory, normalizeRequirement, parseDesignatedRequirement };
