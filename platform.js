// Which installer suits which computer. Shared by the page (app.js) and the release script
// (scripts/release-manifest.mjs). No DOM and no Node APIs, so `node --test` covers it.

export const PLATFORM_LABELS = { mac: 'macOS', windows: 'Windows', linux: 'Linux' }

// Installer kinds per platform, the one to offer first at the top.
export const KINDS = {
  mac: ['dmg', 'mac-zip'],
  windows: ['exe', 'win-zip'],
  linux: ['appimage', 'deb']
}

export const KIND_LABELS = {
  dmg: 'Disk image (.dmg)',
  'mac-zip': 'Zip archive (.zip)',
  exe: 'Installer (.exe)',
  'win-zip': 'Portable zip (.zip)',
  appimage: 'AppImage',
  deb: 'Debian / Ubuntu package (.deb)'
}

function archOf(lower) {
  if (/(arm64|aarch64)/.test(lower)) return 'arm64'
  if (/ia32/.test(lower)) return 'ia32'
  // electron-builder's default names leave x64 out, so no architecture means x64.
  return 'x64'
}

// What an installer file is, from its name: doIT-0.1.0-mac-arm64.dmg → mac, arm64, dmg. Also
// reads electron-builder's default names ("doIT Setup 0.1.0.exe", doit_0.1.0_amd64.deb). Null
// for anything that is not an installer: blockmaps, update metadata, debug files.
export function classify(fileName) {
  const lower = fileName.toLowerCase()
  if (/\.(blockmap|yml|yaml|txt|json)$/.test(lower)) return null
  let platform = null
  let kind = null
  if (lower.endsWith('.dmg')) [platform, kind] = ['mac', 'dmg']
  else if (lower.endsWith('.exe')) [platform, kind] = ['windows', 'exe']
  else if (lower.endsWith('.appimage')) [platform, kind] = ['linux', 'appimage']
  else if (lower.endsWith('.deb')) [platform, kind] = ['linux', 'deb']
  else if (lower.endsWith('.zip') && /(^|[-_.])mac([-_.]|$)/.test(lower)) [platform, kind] = ['mac', 'mac-zip']
  else if (lower.endsWith('.zip') && /(^|[-_.])win([-_.]|$)/.test(lower)) [platform, kind] = ['windows', 'win-zip']
  if (!platform) return null
  return { platform, arch: archOf(lower), kind }
}

// The version in an installer's name: doIT-0.1.0-mac-arm64.dmg → 0.1.0.
export function versionOf(fileName) {
  const m = /(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+?)??)(?=[-_ .](?:mac|win|linux|x64|arm64|amd64|ia32|setup)|\.(?:dmg|exe|zip|appimage|deb)$|_)/i.exec(fileName)
  return m ? m[1] : null
}

// The visitor's platform, from the browser's user agent (and the client hint, where the browser
// sends one). Phones and tablets get 'mobile': doIT is a desktop app.
export function detectPlatform(userAgent = '', hintPlatform = '') {
  const s = `${hintPlatform} ${userAgent}`.toLowerCase()
  if (/android|iphone|ipad|ipod|mobile/.test(s)) return 'mobile'
  if (/mac|darwin/.test(s)) return 'mac'
  if (/win/.test(s)) return 'windows'
  if (/linux|x11|ubuntu|fedora/.test(s)) return 'linux'
  return 'unknown'
}

// From the browser's architecture client hint ('arm' or 'x86'); null when the browser does not
// say. Safari and Firefox never do, so a Mac without the hint is offered both builds.
export function detectArch(hintArchitecture) {
  if (hintArchitecture === 'arm') return 'arm64'
  if (hintArchitecture === 'x86') return 'x64'
  return null
}

export function archLabel(platform, arch) {
  if (platform === 'mac') return arch === 'arm64' ? 'Apple Silicon' : arch === 'x64' ? 'Intel' : arch
  return arch === 'x64' ? '64-bit (x64)' : arch === 'arm64' ? 'ARM64' : arch
}

const kindRank = (f) => KINDS[f.platform]?.indexOf(f.kind) ?? 99

// A platform's files, the kind to offer first leading; within a kind, the visitor's
// architecture first, then Apple Silicon before Intel (Macs sold since 2020) and x64 first.
export function filesFor(files, platform, arch = null) {
  const archRank = (f) => (arch && f.arch === arch ? 0 : f.arch === (platform === 'mac' ? 'arm64' : 'x64') ? 1 : 2)
  return files.filter((f) => f.platform === platform).sort((a, b) => kindRank(a) - kindRank(b) || archRank(a) - archRank(b))
}

// The download button(s) for the top of the page: one installer, plus the other Mac build when
// the visitor's Mac architecture is unknown.
export function primaryDownloads(files, platform, arch = null) {
  const own = filesFor(files, platform, arch)
  if (own.length === 0) return []
  const first = own[0]
  if (platform === 'mac' && !arch) {
    const other = own.find((f) => f.kind === first.kind && f.arch !== first.arch)
    return other ? [first, other] : [first]
  }
  return [first]
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
