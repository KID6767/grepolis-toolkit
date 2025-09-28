param(
    [string]$Version
)

$ErrorActionPreference = "Stop"

$script = "grepolis-toolkit.user.js"
$changelog = "CHANGELOG.md"
$readme = "README.md"

Write-Host "=== Grepolis Toolkit Release $Version ==="

# 1. Bump version
(Get-Content $script) -replace '(@version\s+)([0-9\.]+)', "`$1$Version" | Set-Content $script -Encoding UTF8
Write-Host "[OK] Bumped version in $script -> $Version"

# 2. Update changelog
$date = Get-Date -Format "yyyy-MM-dd"
Add-Content $changelog "`n## v$Version - $date`n- Update $Version"
Write-Host "[OK] CHANGELOG.md updated"

# 3. Update README
if (Test-Path $readme) {
    $rd = Get-Content $readme -Raw

    if ($rd -notmatch '<img src="assets/logo.png"') {
        $rd = "<div align='center'><img src='assets/logo.png' width='120'/></div>`n`n" + $rd
        Set-Content $readme $rd -Encoding UTF8
        Write-Host "[OK] README.md - logo inserted"
    } else {
        Write-Host "[OK] README.md - logo already present"
    }

    if ($rd -notmatch '## Features') {
        Add-Content $readme "`n## Features`n- Planner (ETA, buffs, BBCode)`n- Finder (ghost towns, inactives)`n- Animated routes`n- World info widget`n- Action log"
        Write-Host "[OK] README.md - added Features"
    } else {
        Write-Host "[OK] README.md - Features already present"
    }
}
