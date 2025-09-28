param(
    [string]$Path = ".",
    [string]$Version = "0.6"
)

Set-Location $Path

# Pliki
$userJs = "grepolis-toolkit.user.js"
$readme = "README.md"
$changelog = "CHANGELOG.md"
$assets = "assets"

if (-not (Test-Path $assets)) {
    New-Item -ItemType Directory -Path $assets | Out-Null
}

# ---------------------------
# USER.JS
# ---------------------------
if (Test-Path $userJs) {
    (Get-Content $userJs) -replace "(?<=@version\s+)\d+\.\d+", $Version | 
        Set-Content $userJs
    Write-Host "[OK] Podbito wersję w $userJs → $Version"
}

# ---------------------------
# README.md
# ---------------------------
$logoSvg = @"
<p align="center">
  <img src="assets/logo.svg" alt="Grepolis Toolkit" width="200"/>
</p>

<h1 align="center">⚔️ Grepolis Toolkit</h1>

<p align="center">
  <b>Nieoficjalny dodatek do Grepolis</b><br/>
  Planer ataków, analiza nieaktywnych graczy, ghost towns i więcej 🚀
</p>

---
"@

if (Test-Path $readme) {
    $content = Get-Content $readme -Raw
    if ($content -notmatch "Grepolis Toolkit") {
        Set-Content $readme ($logoSvg + "`n" + $content)
        Write-Host "[OK] README.md uzupełniony o logo i nagłówek"
    }
} else {
    Set-Content $readme $logoSvg
    Write-Host "[OK] README.md stworzony"
}

# ---------------------------
# CHANGELOG.md
# ---------------------------
$entry = @"
## [$Version] - $(Get-Date -Format yyyy-MM-dd)
### Added
- Ikonka do otwierania/zamykania panelu.
- Animacje (slide-in, fade-in).
- Zapamiętywanie jednostki i buffów.
- README.md odświeżone (logo, nagłówki, badge).
### Fixed
- Poprawki w kodzie panelu, usunięte placeholdery.

"@

if (Test-Path $changelog) {
    $old = Get-Content $changelog -Raw
    Set-Content $changelog ($entry + "`n" + $old)
} else {
    Set-Content $changelog $entry
}
Write-Host "[OK] CHANGELOG.md zaktualizowany"

# ---------------------------
# GIT COMMIT + TAG
# ---------------------------
git add .
git commit -m "Release $Version"
git tag v$Version
git push origin main --tags

Write-Host "[DONE] Release $Version gotowy i wypchnięty na GitHub"
