param (
    [string]$version
)

if (-not $version) {
    Write-Host "âťŚ Podaj wersjÄ™, np.: ./publish.ps1 0.2"
    exit 1
}

# Update meta w userscripcie
(Get-Content "grepolis-toolkit.user.js") -replace '(?<=@version\\s).*', $version |
    Set-Content "grepolis-toolkit.user.js"

# Update changelog
$date = Get-Date -Format "yyyy-MM-dd"
Add-Content "CHANGELOG.md" "## [$version] - $date`n- Aktualizacja wersji $version`n"

git add .
git commit -m "Release $version"
git tag "v$version"
git push origin main --tags

Write-Host "âś… Wersja $version wypchniÄ™ta na GitHub"
