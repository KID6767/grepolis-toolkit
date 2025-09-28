# README – logo i nagłówek
if (Test-Path $readmePath) {
    $rd = Get-Content $readmePath -Raw
    if ($rd -notmatch '<img src="assets/logo.svg"') {
        $logoBlock = @"
<p align="center">
  <img src="assets/logo.svg" width="120" alt="Grepolis Toolkit logo"/>
</p>

<h1 align="center">Grepolis Toolkit</h1>

"@
        $rd = $logoBlock + $rd
        Set-Content $readmePath $rd -Encoding UTF8
        Write-Host "[OK] README.md – dodano logo i nagłówek"
    }
}

## Features
- Attack Planner (name/ID search, buffs, ETA, route overlay)
- Global Finder (Player / Alliance / Ghosts near)
- BBCode export
- Calculation history
- Panel docked under Forum
