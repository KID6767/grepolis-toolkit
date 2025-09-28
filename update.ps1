param(
    [string]$Version
)

$repoPath   = $PSScriptRoot
$changelog  = Join-Path $repoPath "CHANGELOG.md"
$readme     = Join-Path $repoPath "README.md"
$userjs     = Join-Path $repoPath "grepolis-toolkit.user.js"

# 1. Podbij wersję w user.js
(Get-Content $userjs) -replace '(?<=@version\s+)\d+\.\d+', $Version | Set-Content $userjs
Write-Host "[OK] Podbito wersje w grepolis-toolkit.user.js -> $Version"

# 2. CHANGELOG.md
if (Test-Path $changelog) {
    $entry = "## v$Version - $(Get-Date -Format 'yyyy-MM-dd')" + "`n- Aktualizacja funkcji i poprawki" + "`n"
    $old   = Get-Content $changelog
    Set-Content $changelog ($entry + "`n" + ($old -join "`n"))
    Write-Host "[OK] CHANGELOG.md zaktualizowany"
}

# 3. README.md
if (Test-Path $readme) {
    $rd = Get-Content $readme -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        $logoBlock = "<p align='center'><img src='assets/logo.svg' width='120'/></p>`n# Grepolis Toolkit"
        $rd = $logoBlock + "`n" + $rd
        Set-Content $readme $rd
        Write-Host "[OK] README.md - dodano logo i naglowek"
    }
    else {
        Write-Host "[OK] README.md - logo juz istnieje"
    }
}

# 4. Git commit & push
git add .
git commit -m "Release $Version"
git tag "v$Version"
git push origin main --tags

Write-Host "[DONE] Release $Version gotowy i wypchniety na GitHub"
