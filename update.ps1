param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

$scriptPath   = "grepolis-toolkit.user.js"
$changelog    = "CHANGELOG.md"
$readmePath   = "README.md"

Write-Host "=== Grepolis Toolkit Release $Version ===" -ForegroundColor Cyan

# 1) Bump @version in user.js
if (Test-Path $scriptPath) {
    (Get-Content $scriptPath -Raw) -replace '(?m)^(//\s*@version\s+)(\d+\.\d+(\.\d+)*)', "`$1$Version" |
        Set-Content $scriptPath -Encoding UTF8
    Write-Host "[OK] Bumped version in $scriptPath -> $Version"
} else { Write-Host "[WARN] $scriptPath not found" }

# 2) CHANGELOG
$date = Get-Date -Format "yyyy-MM-dd"
$entry = @"
## v$Version ($date)
- Global Finder (ghost/player/alliance/radius) with filters
- Multi-target Planner (list, per-target route, BBCode all)
- Activity Log (scans/calcs/exports) + stats
- Minimap, notifications, export/import JSON, quick actions dock
"@
if (Test-Path $changelog) {
    $old = Get-Content $changelog -Raw
    Set-Content $changelog ($entry + "`r`n" + $old) -Encoding UTF8
} else {
    Set-Content $changelog $entry -Encoding UTF8
}
Write-Host "[OK] CHANGELOG.md updated"

# 3) Ensure README has logo + Features (idempotent)
if (Test-Path $readmePath) {
    $rd = Get-Content $readmePath -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        $header = @"
<p align=""center"">
  <img src=""assets/logo.svg"" width=""140"" alt=""Grepolis Toolkit""/>
</p>

<h1 align=""center"">Grepolis Toolkit</h1>

"@
        $rd = $header + "`r`n" + $rd
    }
    if ($rd -notmatch "## Features") {
        $features = @"
## Features
- Attack Planner (name/ID, buffs, ETA, routes, multi-target)
- Global Finder (Player / Alliance / Ghosts near + filters)
- BBCode export
- Activity Log + stats
- Minimap and notifications
- Docked panel below Forum
"@
        $rd = $rd + "`r`n" + $features
    }
    Set-Content $readmePath $rd -Encoding UTF8
    Write-Host "[OK] README.md updated"
} else { Write-Host "[WARN] README.md not found" }

# 4) Git ops
git add .
git commit -m "Release $Version"
git tag -a "v$Version" -m "Release $Version"
git push origin main
git push origin "v$Version"

Write-Host "[DONE] Release $Version ready and pushed to GitHub" -ForegroundColor Green
