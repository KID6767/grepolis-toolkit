param(
    [string]$Version
)

Write-Host "=== Grepolis Toolkit Release $Version ==="

# Run update.ps1 with correct path
& "$PSScriptRoot\update.ps1" -Path $PSScriptRoot -Version $Version
