param(
    [string]$Version = ""
)

if (-not $Version) {
    Write-Host "Usage: .\run-update.ps1 -Version 0.8"
    exit 1
}

& "$PSScriptRoot\update.ps1" -Version $Version
