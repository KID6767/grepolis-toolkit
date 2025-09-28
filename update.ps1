param(
    [string]$Path = $PSScriptRoot,
    [string]$Version
)

$script = Join-Path $Path "grepolis-toolkit.user.js"
$changelog = Join-Path $Path "CHANGELOG.md"
$readme = Join-Path $Path "README.md"

# --- Bump version in user.js ---
if (Test-Path $script) {
    (Get-Content $script) -replace "(?<=@version\s+)[0-9.]+", $Version |
        Set-Content $script -Encoding UTF8
    Write-Host "[OK] Bumped version in grepolis-toolkit.user.js -> $Version"
} else {
    Write-Host "[ERR] grepolis-toolkit.user.js not found"
    exit 1
}

# --- Update changelog ---
$entry = "## [$Version] - $(Get-Date -Format 'yyyy-MM-dd')`n- Release $Version`n"
if (Test-Path $changelog) {
    $old = Get-Content $changelog
    Set-Content $changelog ($entry + "`n" + ($old -join "`n")) -Encoding UTF8
} else {
    Set-Content $changelog $entry -Encoding UTF8
}
Write-Host "[OK] CHANGELOG.md updated"

# --- Ensure README has logo and Features ---
if (Test-Path $readme) {
    $rd = Get-Content $readme -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        $rd = "<div align='center'><img src='assets/logo.svg' width='120'/></div>`n`n" + $rd
        Write-Host "[OK] README.md - logo added"
    } else {
        Write-Host "[OK] README.md - logo already present"
    }
    if ($rd -notmatch '## Features') {
        $features = @"
## Features
- Attack Planner (multi-target, ETA, buffs)
- Ghost & Inactive Finder (global search, island scan)
- BBCode Export (reports, planner results)
- Animated Routes on Map
- Persistent Settings & History
"@
        $rd += "`n$features"
        Write-Host "[OK] README.md - Features added"
    } else {
        Write-Host "[OK] README.md - Features already present"
    }
    Set-Content $readme $rd -Encoding UTF8
}

# --- Git commit & push ---
git add .
git commit -m "Release $Version"
git push origin main
git tag "v$Version"
git push origin "v$Version"

Write-Host "[DONE] Release $Version ready and pushed to GitHub"
