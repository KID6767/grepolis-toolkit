param(
    [string]$Path = ".",
    [string]$Version = "0.7"
)

$repoPath = Resolve-Path $Path
Set-Location $repoPath

$userjsPath = Join-Path $repoPath "grepolis-toolkit.user.js"
$readmePath = Join-Path $repoPath "README.md"
$changelog  = Join-Path $repoPath "CHANGELOG.md"

# 1) user.js – podbij wersję i wstaw update/download URL jeśli brakuje
if (Test-Path $userjsPath) {
    $js = Get-Content $userjsPath -Raw
    $js = $js -replace '(?m)(^//\s*@version\s+)(\d+\.\d+)', "`$10.7"
    if ($js -notmatch '@updateURL') {
        $js = $js -replace '(?m)(^//\s*@icon.*$)', "`$0`r`n// @updateURL    https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js"
    }
    if ($js -notmatch '@downloadURL') {
        $js = $js -replace '(?m)(^//\s*@updateURL.*$)', "`$0`r`n// @downloadURL https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js"
    }
    Set-Content $userjsPath $js -Encoding UTF8
    Write-Host "[OK] grepolis-toolkit.user.js zaktualizowany → $Version"
}

# 2) CHANGELOG
$entry = @"
## [$Version] - $(Get-Date -Format yyyy-MM-dd)
### Added
- Ikona przy portrecie otwierająca Toolkit.
- Planer: wyszukiwanie miast po nazwie lub ID, auto-uzupełnianie z własnych miast.
- Animowane trasy na mapie (kolor wg jednostki).
- BBCode eksport planu.
- Finder: skan „widocznej wyspy” → wykrywanie Ghostów i szybkie „Ustaw jako cel”.

### Improved
- Zapamiętywanie ustawień (jednostka, buffy, prędkość świata).
"@
if (Test-Path $changelog) {
    $old = Get-Content $changelog -Raw
    Set-Content $changelog ($entry + "`r`n" + $old) -Encoding UTF8
} else {
    Set-Content $changelog $entry -Encoding UTF8
}
Write-Host "[OK] CHANGELOG.md uzupełniony"

# 3) README – logo na górze (jeśli brak)
$header = @"
<p align=""center"">
  <img src=""assets/logo.svg"" alt=""Grepolis Toolkit"" width=""200""/>
</p>

<h1 align=""center"">⚓ Grepolis Toolkit</h1>

<p align=""center"">Planer ataków • Ghost/Inactive Finder • Animowane trasy • BBCode</p>

---
"@
if (Test-Path $readmePath) {
    $rd = Get-Content $readmePath -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        Set-Content $readmePath ($header + "`r`n" + $rd) -Encoding UTF8
        Write-Host "[OK] README.md – dodano logo i nagłówek"
    }
}

# 4) Git: commit+tag+push
git add .
git commit -m "Release $Version"
git tag "v$Version"
git push origin main
git push origin "v$Version"

Write-Host "[DONE] Release $Version wypchnięty na GitHub"
