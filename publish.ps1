param(
    [string]$Path = ".",
    [string]$Version = "0.4"
)

Set-Location $Path

# 1. Utwórz katalog assets (jeśli brak)
$assetsPath = Join-Path $Path "assets"
if (-not (Test-Path $assetsPath)) {
    New-Item -ItemType Directory -Path $assetsPath | Out-Null
    Write-Host "📂 Utworzono katalog assets/"
}

# 2. Dodaj placeholdery graficzne
$images = @{
    "logo.svg"            = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="90" fill="#444"/><text x="100" y="115" font-size="60" text-anchor="middle" fill="#fff">G</text></svg>'
    "ship_colonize.png"   = ""
    "ship_fire.png"       = ""
    "ship_bireme.png"     = ""
    "ship_trireme.png"    = ""
    "ship_transport.png"  = ""
}

foreach ($img in $images.Keys) {
    $imgPath = Join-Path $assetsPath $img
    if (-not (Test-Path $imgPath)) {
        if ($img -like "*.svg") {
            Set-Content -Path $imgPath -Value $images[$img]
        } else {
            # Tworzymy pusty plik PNG (placeholder)
            [IO.File]::WriteAllBytes($imgPath, [byte[]](0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A))
        }
        Write-Host "🖼️ Dodano $img"
    }
}

# 3. Dopisz wpis do CHANGELOG.md
$changelogPath = Join-Path $Path "CHANGELOG.md"
$today = Get-Date -Format "yyyy-MM-dd"
$changelogEntry = @"
## [$Version] - $today
### Added
- Rysowanie animowanych tras statków na mapie (kolory zależne od typu jednostki).
- Tooltipy z czasem podróży i nazwą statku.
- Animowane przełączanie zakładek w panelu Toolkita.
- Dodano katalog \`assets/\` z grafikami (logo, ikonki statków).

"@

$old = Get-Content $changelogPath
Set-Content $changelogPath ($changelogEntry + ($old -join "`n"))

Write-Host "✅ CHANGELOG.md zaktualizowany"

# 4. Uzupełnij README.md
$readmePath = Join-Path $Path "README.md"
$readme = Get-Content $readmePath -Raw
if ($readme -notmatch "## Features") {
    Add-Content $readmePath "`n## Features`n- Toolkit panel (Nieaktywni, Ghost Towny, Symulator)`n- Animowane trasy statków na mapie`n"
}
if ($readme -notmatch "## Logo") {
    Add-Content $readmePath "`n## Logo`n![Toolkit Logo](assets/logo.svg)`n"
}

Write-Host "✅ README.md zaktualizowany"

# 5. Commit + tag
git add .
git commit -m "Release $Version"
git tag "v$Version"
git push origin main --tags

Write-Host "🎉 Release $Version gotowy i wypchnięty na GitHub"
