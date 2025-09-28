param (
    [string]$version
)

if (-not $version) {
    Write-Host "❌ Podaj wersję, np.: ./publish.ps1 0.1.0"
    exit 1
}

# Update meta w userscripcie
(Get-Content "grepolis-toolkit.user.js") -replace '(?<=@version\\s).*', $version |
    Set-Content "grepolis-toolkit.user.js"

# Dodaj wpis do changelog
$date = Get-Date -Format "yyyy-MM-dd"
Add-Content "CHANGELOG.md" "## [$version] - $date`n- Aktualizacja wersji $version`n"

# Git workflow
git add .
git commit -m "Release $version"
git tag "v$version"
git push origin main --tags

Write-Host "✅ Wersja $version wypchnięta na GitHub"
