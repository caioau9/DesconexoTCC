$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $root 'game.js'))) {
  $candidate = Join-Path $root 'desconexo-mvp'
  if (Test-Path (Join-Path $candidate 'game.js')) { $root = $candidate }
}

$gamePath = Join-Path $root 'game.js'
if (-not (Test-Path $gamePath)) {
  throw 'game.js was not found. Put this script inside the desconexo-mvp folder.'
}

$game = Get-Content $gamePath -Raw
if (-not $game.Contains('DESCONEXO_SAFE_MOVEMENT_V3')) {
  throw 'The repaired movement controller was not found. Apply repair-desconexo-buttons-and-movement.ps1 first.'
}
if ($game.Contains('DESCONEXO_RAW_MOUSE_V5')) {
  Write-Host 'Raw mouse camera tuning is already installed.' -ForegroundColor Yellow
  exit 0
}

Copy-Item $gamePath "$gamePath.raw-mouse-backup" -Force

# Babylon UniversalCamera uses inertia by default. Setting it to zero removes continued
# rotation after mouse input stops. Disable keyboard angular inertia as well.
$cameraAnchor = "camera.attachControl(canvas,true);"
if (-not $game.Contains($cameraAnchor)) {
  throw 'Could not find the camera initialization line in game.js.'
}
$rawSetup = @"
camera.attachControl(canvas,true);/* DESCONEXO_RAW_MOUSE_V5 */camera.inertia=0;camera.angularSensibility=2650;
"@
$game = $game.Replace($cameraAnchor, $rawSetup.Trim())

# Remove any duplicate angularSensibility assignment immediately following the setup.
$game = $game.Replace("camera.angularSensibility=2650;camera.speed=.085;camera.angularSensibility=2650;", "camera.angularSensibility=2650;camera.speed=.085;")
$game = $game.Replace("camera.angularSensibility=2650;camera.speed=.11;camera.angularSensibility=2800;", "camera.angularSensibility=2650;camera.speed=.085;")
$game = $game.Replace("camera.angularSensibility=2650;camera.speed=.11;camera.angularSensibility=1550;", "camera.angularSensibility=2650;camera.speed=.085;")

# Keep direct 1:1 mouse response. Focus changes only FOV and speed, not rotation filtering.
# Normalize runtime sensitivity formula if the precision patch has not yet been applied.
$game = $game.Replace("camera.angularSensibility=1500/motionPrefs.sensitivity;", "camera.angularSensibility=2650/motionPrefs.sensitivity;")

Set-Content $gamePath $game -Encoding UTF8

Write-Host ''
Write-Host 'Raw, zero-inertia mouse camera installed.' -ForegroundColor Green
Write-Host 'Mouse rotation now stops on the same frame that mouse movement stops.' -ForegroundColor Cyan
Write-Host 'The slower 100% sensitivity baseline remains active.'
Write-Host 'Restart the server and refresh the page with Ctrl+F5.' -ForegroundColor Yellow
