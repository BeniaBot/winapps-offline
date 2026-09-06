# Security Policy

## What this project is

winapps-offline is a volunteer, non-commercial project that distributes offline installers for Windows applications and components, aimed at machines that have no internet access.

It is not affiliated with, authorised by, sponsored by or endorsed by Microsoft or any other vendor whose software it lists.

## Official distribution channels

There are exactly two:

- https://beniabot.github.io/winapps-offline/
- https://github.com/BeniaBot/winapps-offline (Releases)

Anything else offering "the same files" is not this project. We do not know what it contains, and we cannot vouch for it.

## What we promise

- Vendor and Microsoft packages are redistributed **unmodified** — not repackaged, re-signed, patched, or stripped of notices. Some are *carried inside* an installer or an ISO we build; the carried file is byte-identical to the file we received, and the vendor's signature stays on it. Carrying is not modifying, and we say which is which rather than letting one word cover both.
- **What backs that claim, precisely.** Every package is fetched over TLS from the vendor's or Microsoft's CDN; the build records the SHA-256, the full signer subject and the certificate thumbprint of each file at the moment it is fetched, and fails the build if any of them changes without a human approving the change; and the SHA-256 of every byte embedded in a shipped installer is re-checked against that record before release. Where that pipeline is not yet in place for an item, the item's page says so, rather than implying a check that does not run. "As received" is only worth something if we say what we verified on receipt.
- We publish, for every item, two hashes: the SHA-256 of the file we ship, **and** the filename, size and SHA-256 of the vendor's original file carried inside it. The second one can be checked against the vendor's own site, from any connected machine, without trusting us at all.
- The one exception to "unmodified" is Hebrew-translated builds produced by this project. These **are** modified, are labelled as such everywhere they appear, and consequently no longer carry a valid original vendor signature.
- We will **never** ask a user to disable protection software, a firewall, Defender, or a filtering mechanism.
- We will **never** ask for a password, payment details, an ID number, or a one-time code.
- We will never contact users first — by phone, message, or pop-up. Anyone doing so in this project's name is not us.
- **The two settings we may ask you to change, stated up front rather than sprung on you.** (1) Starting the Windows Firewall service: Windows writes firewall rules for every Store package and deploys none while that service is stopped, and its error message misleads. That turns a protection *on*. (2) On machines where an administrator or filtering profile has locked it, allowing Store packages to be installed from a file ("developer mode"). That one is a genuine relaxation, we say so, and we ask you to turn it back off afterwards. Anything beyond these two, in this project's name, is not us — "go to Settings and turn this on" is exactly what a phone scam sounds like, which is why we publish the complete list.

## Verifying a download

Two different things can be verified, and this section is explicit about which one applies to which file — an instruction that silently fails teaches people that verification does not work.

### Hash — applies to every file we ship

Let the machine do the comparison. Do not eyeball 64 hex characters.

```powershell
$expected = '<paste the value from the item page>'
if ((Get-FileHash .\Setup-Notepad.exe).Hash -eq $expected) { 'MATCH' } else { 'NO MATCH' }
```

`Get-FileHash` defaults to SHA-256. Without PowerShell:

```
certutil -hashfile Setup-Notepad.exe SHA256
```

On older Windows builds `certutil` prints the digest with spaces between byte pairs; strip them before comparing.

**Where the comparison has to happen.** A `SHA256SUMS.txt` riding on the same USB stick as the files it covers is not a check — whoever could alter the payload could alter the list. The expected value must come from elsewhere: from the site, on the connected machine, **before** copying.

And it does **not** protect against a compromise of this project's GitHub account. An attacker in that position would update the hash list too. We state that plainly rather than implying more than the check delivers.

### The stronger check: against the vendor, not against us

Each item also publishes the name, size and SHA-256 of the vendor's original file carried inside our installer. Compare that value against what the vendor publishes, and this project drops out of the trust chain entirely. It is the only verification here that survives our own account being taken over, and it is the one we would want a careful user to run.

### Signatures — what you can actually inspect

**Store apps.** The signed Microsoft bundle is embedded as a resource inside our installer, so there is no separate file to inspect. And Explorer shows no Digital Signatures tab for `.appxbundle` / `.msixbundle` in any case: the signature lives inside the package (`AppxSignature.p7x`), not in a PE certificate table. Do not go looking for a tab that will not appear.

What *does* happen is real: Windows verifies the package signature itself during deployment and refuses a package that is not properly signed. That check is performed by the operating system, not by us.

**Win32 programs** — browsers, 7-Zip, media players, the runtimes, everything on the disc. Here you hold the vendor's own EXE or MSI: right-click → Properties → **Digital Signatures** → select the row → **Details**.

**Windows does not do this for you** when a local installer is launched from a folder, and our installers do not call `WinVerifyTrust` either. If you do not open that tab and look, no signature was checked. We would rather say that than let you believe in a check that isn't running.

## Unsigned installers

The installer shell written by this project is **not code-signed**.

What you will see:

- With the mark-of-the-web present: SmartScreen's blue "Windows protected your PC" screen — *More info* → *Run anyway*.
- **In addition, in almost every case:** a UAC prompt naming an unknown publisher. Most installers here request `requireAdministrator`, so that prompt appears even when the blue screen does not. (A small number install only into the user's own profile and raise no UAC prompt.) Anyone who told you to expect no warning at all was wrong.

That warning is correct — the system genuinely does not know who wrote the file.

**What the hash does and does not answer.** It says the bytes are the ones we published. It does not say we are trustworthy — and that is the question SmartScreen is actually asking. The answer to that one is not a number: the source is open, the payload inside is the vendor's own signed file, and both can be checked independently. Verifying a hash is not "doing what the warning asked"; treating it that way is the habit an attacker holding our account would most like users to have.

**Mark-of-the-web and removable media.** The mark is an NTFS alternate data stream. FAT32 and exFAT — how most USB sticks are formatted — cannot carry it, so it is dropped on copy. (Right-click the drive → Properties shows the filesystem.) On the offline machine you may therefore get no SmartScreen screen — not because anything was checked, but because the marker is gone.

**Verify the hash on the connected machine, before copying to the stick.** Afterwards there is nothing left to compare against.

## Reporting a vulnerability

Please report privately first:

- GitHub → **Security → Report a vulnerability** on this repository (private vulnerability reporting is enabled), or
- Email: [EDIT ME: project email address]

Please include: what you found, which file or URL, how to reproduce it, and how you would like to be credited.

**Expected first response: 7 days.** This is a one-person volunteer project; that window is what can honestly be kept, not a best case.

Please do not open a public issue for a suspected supply-chain or account compromise.

## Safe harbour for researchers

If you report a vulnerability in good faith, act only to the minimum extent needed to demonstrate it, do not damage data or affect other users, and give us a reasonable chance to fix it before publishing, then **we will not pursue legal action or file a complaint against you, and we regard your testing as authorised by us.**

That promise is ours alone. It does not bind third parties — GitHub, the vendors, or anyone else — and it does not authorise anything against systems that are not ours. Test only what belongs to this project.

## In scope

- Tampered, replaced, or unexpected release assets.
- Anything in the build pipeline that could let a third party influence the bytes we publish (`build/getcomp.ps1`, `build/download.ps1`, `build/fwdownload.ps1`, `build/src/*`).
- Client-side issues in the site (injection, unsafe DOM handling, unintended third-party requests).
- Sites impersonating this project.

## Out of scope

- Vulnerabilities in the vendors' own software. Report those to the vendor; we redistribute their files unchanged.
- Components knowingly shipped past end-of-life. They are required by legacy software, are the vendors' original signed files, receive no further fixes, and are labelled accordingly on the site.
- Missing HTTP response headers that GitHub Pages does not allow a site owner to set (including `frame-ancestors` enforcement, which cannot be delivered via a meta CSP).
- The maintenance panel gated by a hash in the page. It is cosmetic, it exposes nothing that is not already public, and it is documented as such in the source.

There is no bug bounty. There is thanks, and credit if you want it.

## If a compromise is confirmed

1. The affected release is pulled immediately.
2. Known-good hashes are published — **and, so that this step is worth anything, they are also recorded out-of-band in advance.** A hash list published only from the account that was taken over proves nothing; the verification section above says as much, and it would be dishonest to then offer that same channel as the remedy. Each release's hash list is therefore also posted, dated, to a channel not controlled by that account. The front page names where. In an incident, compare against that copy, not only against this repository.
3. A dated notice goes on the site's front page and in the repository README, saying which files and which dates were affected.
4. Credentials are rotated and the incident is written up publicly once it is understood.
5. Releases are immutable and tagged by date, so an asset that changed under an existing tag is itself a signal — not something a reader has to take on trust.

## Copyright and takedown

Rights holders: see the takedown page on the site. Files are removed as fast as we can manage — our own target is 72 hours, and we hit it nearly always, but this is a one-person project and we state it as a target rather than a contractual guarantee. No argument, no legal correspondence required first. The pseudonym is not a shield: a rights holder who needs the operator's identity to pursue a claim will be given it. Contact: [EDIT ME: project email address].