# Keeps a custom disc current without anyone remembering to rebuild it.
#
#   update-custom-iso.ps1 -Folder D:\my-disc             # rebuild if the catalogue changed
#   update-custom-iso.ps1 -Folder D:\my-disc -Install    # ...and do that every day from now on
#
# The folder is the one the "Custom ISO" button filled: בחירת-חנות.txt, and the disc it made.
# Every line of the selection names its source - a vendor's "latest" address, or a file in this
# store's release, which is replaced in place whenever it is rebuilt - so running IsoBuilder again
# on the same selection is all it takes to get today's build of everything on it. What this script
# adds is knowing WHEN: it looks at the catalogue once a day, and only a changed catalogue costs
# a rebuild. It also takes IsoBuilder itself fresh each time, so a better builder reaches an
# existing disc without the selection being exported again.
param(
  [Parameter(Mandatory)] [string]$Folder,
  [switch]$Install,
  [int]$TimeoutHours = 6
)
$ErrorActionPreference = 'Stop'
$REL  = 'https://github.com/BeniaBot/winapps-offline/releases/download/apps-v1/'
$SITE = 'https://beniabot.github.io/winapps-offline/site-catalog.json'
$Folder = (Resolve-Path $Folder).Path
$iso  = Join-Path $Folder 'WINAPPS-CUSTOM.iso'
$seen = Join-Path $Folder '.catalog-sha256'
$log  = Join-Path $Folder 'update-custom-iso.log'
function Say($m) { $l = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $m; $l; Add-Content -Path $log -Value $l -Encoding UTF8 }

if ($Install) {
  $me = $MyInvocation.MyCommand.Path
  $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$me`" -Folder `"$Folder`""
  $act = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg
  $when = New-ScheduledTaskTrigger -Daily -At 4am
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Hours ($TimeoutHours + 1))
  Register-ScheduledTask -TaskName 'WinApps custom ISO' -Action $act -Trigger $when -Settings $set -Force | Out-Null
  Say "scheduled daily at 04:00 for $Folder"
}

if (-not (Test-Path (Join-Path $Folder 'בחירת-חנות.txt')) -and -not (Test-Path (Join-Path $Folder 'store-selection.txt'))) {
  throw "no selection file in $Folder - the site's Custom ISO button downloads it"
}

# The catalogue is the one file that changes whenever anything on the shelf does.
$tmp = [IO.Path]::GetTempFileName()
Invoke-WebRequest $SITE -OutFile $tmp -UseBasicParsing
$sha = (Get-FileHash $tmp -Algorithm SHA256).Hash
Remove-Item $tmp
if ((Test-Path $iso) -and (Test-Path $seen) -and (Get-Content $seen) -eq $sha) { Say 'catalogue unchanged - the disc is current'; return }

Invoke-WebRequest ($REL + 'IsoBuilder.exe') -OutFile (Join-Path $Folder 'IsoBuilder.exe') -UseBasicParsing
$start = Get-Date
Say 'catalogue changed - rebuilding'
$p = Start-Process (Join-Path $Folder 'IsoBuilder.exe') -WorkingDirectory $Folder -PassThru

# IsoBuilder is a window with a Close button, not a command: it says "Done" and waits. The disc
# is finished when a new ISO exists and nothing is writing to it any more.
function Done {
  if (-not (Test-Path $iso) -or (Get-Item $iso).LastWriteTime -le $start) { return $false }
  try { [IO.File]::Open($iso, 'Open', 'Read', 'None').Close(); return $true } catch { return $false }
}
while (-not $p.HasExited -and -not (Done)) {
  if ((Get-Date) - $start -gt [TimeSpan]::FromHours($TimeoutHours)) { $p.Kill(); throw 'IsoBuilder did not finish in time' }
  Start-Sleep 10
}
if (-not (Done)) { throw 'IsoBuilder closed without a new disc - run it by hand to see why' }
Start-Sleep 5
if (-not $p.HasExited) { $p.CloseMainWindow() | Out-Null; Start-Sleep 3; if (-not $p.HasExited) { $p.Kill() } }
Set-Content $seen $sha
Say ("new disc: {0:N0} MB" -f ((Get-Item $iso).Length / 1MB))
