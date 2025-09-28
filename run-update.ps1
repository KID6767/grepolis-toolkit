param(
    [string]$Version = ""
)

if (-not $Version) {
    Write-Host "❌ Musisz podać wersję, np.: .\run-update.ps1 -Version 0.7"
    exit 1
}

# Uruchamiamy właściwy update.ps1
& "$PSScriptRoot\update.ps1" -Version $Version
