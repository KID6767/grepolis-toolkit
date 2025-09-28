param(
    [string]$Version
)

$ErrorActionPreference = "Stop"

$repoPath  = $PSScriptRoot
$changelog = Join-Path $repoPath "CHANGELOG.md"
$readme    = Join-Path $repoPath "README.md"
$userjs    = Join-Path $repoPath "grepolis-toolkit.user.js"

# 1) bump @version in user.js
if (Test-Path $userjs) {
    (Get-Content $userjs -Raw) -replace '(?m)^(//\s*@version\s+)(\d+\.\d+)', "`$1$Version" | Set-Content $userjs -Encoding UTF8
    Write-Host "[OK] Bumped version in grepolis-toolkit.user.js -> $Version"
} else {
    Write-Host "[WARN] grepolis-toolkit.user.js not found"
}

# 2) CHANGELOG
$date = Get-Date -Format "yyyy-MM-dd"
$entry = @"
## v$Version ($date)
- Global Finder: player, alliance, ghosts near (beta)
- Planner: ETA h:m:s, auto world speed, calculation history
- BBCode v2
- Panel placed under Forum (left menu)
"@
if (Test-Path $changelog) {
    $old = Get-Content $changelog -Raw
    Set-Content $changelog ($entry + "`r`n" + $old) -Encoding UTF8
} else {
    Set-Content $changelog $entry -Encoding UTF8
}
Write-Host "[OK] CHANGELOG.md updated"

# 3) README header (logo + title) and Features section if missing
if (Test-Path $readme) {
    $rd = Get-Content $readme -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        $logo = '<p align="center"><img src="assets/logo.svg" width="120"></p>'
        $rd   = $logo + "`r`n" + $rd
        Set-Content $readme $rd
        Write-Host "[OK] README.md - dodano logo i nagłówek"
    } else {
        Write-Host "[OK] README.md - logo już istnieje"
    }

    if ($rd -notmatch '## Features') {
        $features = @"
## Features
- Attack Planner (name/ID search, buffs, ETA, route overlay)
- Global Finder (Player / Alliance / Ghosts near)
- BBCode export
- Calculation history
- Panel docked under Forum
"@
        Add-Content $readme "`r`n$features"
        Write-Host "[OK] README.md - dodano Features"
    }
} else {
    Write-Host "[WARN] README.md not found"
}

# 4) git commit / tag / push
git add .
git commit -m "Release $Version"
git tag -a "v$Version" -m "Release $Version"
git push origin main
git push origin "v$Version"

Write-Host "[DONE] Release $Version ready and pushed to GitHub"
