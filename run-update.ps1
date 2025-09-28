param(
    [string]$Version
)

if (-not $Version) {
    Write-Host "❌ Musisz podać numer wersji, np.: .\run-update.ps1 -Version 0.5"
    exit 1
}

$repoPath = "C:\Users\macie\Documents\GitHub\grepolis-toolkit"
$updateScript = Join-Path $repoPath "update.ps1"

& $updateScript -Path $repoPath -Version $Version
