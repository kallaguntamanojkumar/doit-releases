# doIT releases

Installers for **doIT**, the desktop app that sets up AWS networking, deploys containers to
Amazon ECS and keeps them running, with Terraform it runs for you in your own AWS account.

Download them from [Releases](https://github.com/kallaguntamanojkumar/doit-releases/releases/latest):

| | x64 | arm64 |
|---|---|---|
| macOS | `.dmg`, `.zip` (Intel) | `.dmg`, `.zip` (Apple Silicon) |
| Windows | `.exe` installer, portable `.zip` | `.exe` installer, portable `.zip` |
| Linux | `.AppImage`, `.deb` (`x86_64`, `amd64`) | `.AppImage`, `.deb` |

Every release lists each file's SHA-256 in `SHA256SUMS.txt`; check a download with
`shasum -a 256 -c SHA256SUMS.txt` (macOS), `sha256sum -c SHA256SUMS.txt` (Linux) or
`Get-FileHash <file> -Algorithm SHA256` (Windows PowerShell).

The installers are not code-signed yet, so macOS and Windows ask you to confirm the first time
you open doIT.

This repository holds only the installers; doIT's source is not here.
