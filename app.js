// Renders the downloads from releases.json, offering the visitor's platform first. Every value
// from the manifest goes in through textContent or an attribute, never as HTML.

import {
  KIND_LABELS,
  PLATFORM_LABELS,
  archLabel,
  detectArch,
  detectPlatform,
  filesFor,
  formatBytes,
  primaryDownloads
} from './platform.js'

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'class') node.className = value
    else node.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) node.append(child)
  return node
}

async function loadManifest() {
  try {
    const res = await fetch('releases.json', { cache: 'no-cache' })
    if (!res.ok) return null
    const manifest = await res.json()
    return Array.isArray(manifest?.files) ? manifest : null
  } catch {
    return null
  }
}

async function visitorArch() {
  try {
    const hints = await navigator.userAgentData?.getHighEntropyValues?.(['architecture'])
    return detectArch(hints?.architecture)
  } catch {
    return null
  }
}

const fileSummary = (f) => [archLabel(f.platform, f.arch), KIND_LABELS[f.kind] ?? f.kind, formatBytes(f.size)].filter(Boolean).join(' · ')

function downloadButton(file, primary) {
  const label = file.platform === 'mac' && primary ? `Download for Mac (${archLabel('mac', file.arch)})` : `Download for ${PLATFORM_LABELS[file.platform]}`
  return el(
    'a',
    { class: primary ? 'btn primary' : 'btn', href: file.url, download: true },
    el('span', { class: 'btn-title' }, label),
    el('span', { class: 'btn-sub' }, fileSummary(file))
  )
}

function renderHero(manifest, platform, arch) {
  const box = document.getElementById('hero-download')
  box.replaceChildren()
  if (!manifest || manifest.files.length === 0) {
    box.append(el('p', { class: 'notice' }, 'No release has been published yet. Check back soon.'))
    return
  }
  if (platform === 'mobile') {
    box.append(el('p', { class: 'notice' }, 'doIT is a desktop app for Windows, macOS and Linux. Open this page on your computer to download it.'))
  } else if (platform === 'unknown') {
    box.append(el('p', { class: 'notice' }, 'Choose your platform below.'))
  } else {
    const picks = primaryDownloads(manifest.files, platform, arch)
    if (picks.length === 0) {
      box.append(el('p', { class: 'notice' }, `doIT ${manifest.version} is not available for ${PLATFORM_LABELS[platform]} yet. See the other platforms below.`))
    } else {
      box.append(el('div', { class: 'buttons' }, picks.map((f, i) => downloadButton(f, i === 0))))
    }
  }
  box.append(
    el(
      'p',
      { class: 'muted small' },
      `Version ${manifest.version}${manifest.releasedAt ? `, released ${manifest.releasedAt}` : ''}. `,
      el('a', { href: '#download' }, 'All downloads and checksums')
    )
  )
}

async function copyText(button, text) {
  try {
    await navigator.clipboard.writeText(text)
    button.textContent = 'Copied'
  } catch {
    button.textContent = 'Select and copy'
  }
}

function fileRow(file) {
  const copy = el('button', { type: 'button', class: 'btn small ghost', title: 'Copy the SHA-256 checksum' }, 'Copy')
  copy.addEventListener('click', () => copyText(copy, file.sha256))
  return el(
    'li',
    { class: 'file' },
    el(
      'div',
      { class: 'file-main' },
      el('a', { href: file.url, download: true, class: 'file-link' }, KIND_LABELS[file.kind] ?? file.name),
      el('span', { class: 'muted small' }, [archLabel(file.platform, file.arch), formatBytes(file.size)].filter(Boolean).join(' · '))
    ),
    el(
      'div',
      { class: 'file-sum' },
      el('code', { class: 'sha', title: file.sha256 }, `SHA-256 ${file.sha256.slice(0, 16)}…`),
      copy
    ),
    el('span', { class: 'muted small file-name' }, file.name)
  )
}

function renderDownloads(manifest, platform) {
  const grid = document.getElementById('downloads')
  grid.replaceChildren()
  for (const p of Object.keys(PLATFORM_LABELS)) {
    const files = manifest ? filesFor(manifest.files, p) : []
    grid.append(
      el(
        'article',
        { class: p === platform ? 'card platform yours' : 'card platform', id: `download-${p}` },
        el('div', { class: 'platform-head' }, el('h3', {}, PLATFORM_LABELS[p]), p === platform ? el('span', { class: 'badge' }, 'Your computer') : null),
        files.length
          ? el('ul', { class: 'files' }, files.map(fileRow))
          : el('p', { class: 'muted' }, manifest?.version ? 'Not built for this release yet.' : 'No release yet.')
      )
    )
  }
  const meta = document.getElementById('release-meta')
  meta.textContent = manifest?.version ? `doIT ${manifest.version}${manifest.releasedAt ? ` · ${manifest.releasedAt}` : ''}` : ''
  const sums = document.getElementById('checksums')
  sums.replaceChildren()
  if (manifest?.checksums && manifest.files.length) {
    sums.append('Every checksum in one file: ', el('a', { href: manifest.checksums }, 'SHA256SUMS.txt'), ' (for ', el('code', {}, 'sha256sum -c'), ').')
  }
  document.getElementById('footer-version').textContent = manifest?.version ? `Version ${manifest.version}` : ''
}

async function main() {
  const platform = detectPlatform(navigator.userAgent, navigator.userAgentData?.platform ?? '')
  const [manifest, arch] = await Promise.all([loadManifest(), visitorArch()])
  renderHero(manifest, platform, arch)
  renderDownloads(manifest, platform)
}

main()
