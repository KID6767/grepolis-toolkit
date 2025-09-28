param(
    [string]$Path = ".",
    [string]$Version
)

if (-not $Version) {
    Write-Host "❌ Musisz podać numer wersji, np. -Version '0.5'"
    exit 1
}

$repoPath = Resolve-Path $Path
Set-Location $repoPath

$changelogPath = Join-Path $repoPath "CHANGELOG.md"
$readmePath    = Join-Path $repoPath "README.md"
$userjsPath    = Join-Path $repoPath "grepolis-toolkit.user.js"
$assetsPath    = Join-Path $repoPath "assets"

# 🔹 1. Upewniamy się, że assets istnieje
if (-not (Test-Path $assetsPath)) {
    New-Item -ItemType Directory -Path $assetsPath | Out-Null
    Write-Host "[OK] Utworzono katalog assets/"
}

# 🔹 2. Podbijamy wersję w grepolis-toolkit.user.js
if (Test-Path $userjsPath) {
    $content = Get-Content $userjsPath
    $newContent = $content -replace '(?<=// @version\s+)(\d+\.\d+)', $Version
    Set-Content $userjsPath $newContent -Encoding UTF8
    Write-Host "[OK] Podbito wersję w grepolis-toolkit.user.js → $Version"
} else {
    Write-Host "[WARN] Nie znaleziono pliku grepolis-toolkit.user.js"
}

# 🔹 3. Aktualizacja CHANGELOG.md
$date = Get-Date -Format "yyyy-MM-dd"
$entry = @"
## [$Version] - $date
### Added
- Nowy planer ataków (zastępuje kalkulator).
- Obliczanie ETA (dokładna godzina dotarcia).
- Obsługa buffów (Posejdon, żagle, kapitan).
- Animowane linie tras statków (kolonizacyjny, birema, trirema, ogniowy, transportowy).

### Fixed
- Automatyczne podbijanie wersji w user.js (dla Tampermonkey).
"@

if (Test-Path $changelogPath) {
    $old = Get-Content $changelogPath
    Set-Content $changelogPath ($entry + "`n" + ($old -join "`n")) -Encoding UTF8
    Write-Host "[OK] CHANGELOG.md zaktualizowany"
}

# 🔹 4. Aktualizacja README.md (dopisz Features jeśli brak)
$featuresBlock = @"
## Features
- Toolkit panel (Nieaktywni gracze, Ghost Towns)
- Planer ataków z ETA i buffami
- Animowane linie tras statków
- Eksport planów do BBCode (forum sojuszu)
"@

if (Test-Path $readmePath) {
    $readmeContent = Get-Content $readmePath -Raw
    if ($readmeContent -notmatch "## Features") {
        Add-Content $readmePath "`n$featuresBlock"
        Write-Host "[OK] README.md uzupełniony o Features"
    }
}

# 🔹 5. Git add / commit / tag / push
git add .
git commit -m "Release $Version"
git tag "v$Version"
git push origin main
git push origin "v$Version"

Write-Host "[DONE] Release $Version gotowy i wypchnięty na GitHub"
