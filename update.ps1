param (
    [string]$Version
)

$scriptPath = "grepolis-toolkit.user.js"
$changelogPath = "CHANGELOG.md"
$readmePath = "README.md"

# --- Update version in .user.js ---
if (Test-Path $scriptPath) {
    (Get-Content $scriptPath) |
        ForEach-Object { $_ -replace "(?<=@version\s+)\d+(\.\d+)*", $Version } |
        Set-Content $scriptPath -Encoding UTF8
    Write-Host "[OK] Bumped version in $scriptPath -> $Version"
}

# --- Update CHANGELOG.md ---
if (Test-Path $changelogPath) {
    $date = Get-Date -Format "yyyy-MM-dd"
    $entry = "## [$Version] - $date`n- Updated features and fixes`n"
    Add-Content $changelogPath "`n$entry"
    Write-Host "[OK] $changelogPath updated"
}

# --- Update README.md (logo + features) ---
if (Test-Path $readmePath) {
    $rd = Get-Content $readmePath -Raw

    # Add logo if missing
    if ($rd -notmatch "<img src=""assets/logo.svg""") {
        $logoBlock = "<img src=""assets/logo.svg"" alt=""Grepolis Toolkit"" width=""120"">`n"
        $rd = $logoBlock + $rd
        Set-Content $readmePath $rd -Encoding UTF8
        Write-Host "[OK] README.md - added logo"
    }
    else {
        Write-Host "[OK] README.md - logo already present"
    }

    # Add Features if missing
    if ($rd -notmatch "## Features") {
        $features = @"
## Features
- ⚔️ Attack Planner – search cities by name/ID, buffs (Poseidon, Sails, Captain), ETA, animated route overlay
- 🌍 Global Finder – scan islands, find players, alliances and ghost towns
- 📝 BBCode Export – copy results for forum/alliance/notes
- ⏱️ History of calculations – quick access to recent results
- 📌 Docked panel below Forum – easy to toggle
"@
        $rd = $rd + "`r`n" + $features
        Set-Content $readmePath $rd -Encoding UTF8
        Write-Host "[OK] README.md - added Features"
    }
    else {
        Write-Host "[OK] README.md - Features already present"
    }
}

# --- Commit & Tag ---
git add .
git commit -m "Release $Version"
git tag "v$Version"
git push
git push origin "v$Version"

Write-Host "[DONE] Release $Version ready and pushed to GitHub"
