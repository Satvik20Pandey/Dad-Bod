$ErrorActionPreference = "Stop"

$sdkRoot = Join-Path $env:USERPROFILE "Android\Sdk"
$tempZip = Join-Path $env:TEMP "android-cmdline-tools.zip"
$tempExtract = Join-Path $env:TEMP "android-cmdline-tools"
$cmdlineDir = Join-Path $sdkRoot "cmdline-tools"
$latestDir = Join-Path $cmdlineDir "latest"

Write-Host "Using SDK root: $sdkRoot"

New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null
New-Item -ItemType Directory -Force -Path $cmdlineDir | Out-Null

if (Test-Path $tempExtract) {
  Remove-Item -Recurse -Force $tempExtract
}

Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip" -OutFile $tempZip
Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

if (Test-Path $latestDir) {
  Remove-Item -Recurse -Force $latestDir
}

$sourceToolsDir = Join-Path $tempExtract "cmdline-tools"
if (-not (Test-Path $sourceToolsDir)) {
  throw "Command-line tools folder was not found after extraction."
}

Move-Item -Path $sourceToolsDir -Destination $latestDir

$sdkManager = Join-Path $latestDir "bin\sdkmanager.bat"
if (-not (Test-Path $sdkManager)) {
  throw "sdkmanager.bat not found at $sdkManager"
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$env:PATH;$sdkRoot\platform-tools;$latestDir\bin"

# Persist for new shells
setx ANDROID_HOME $sdkRoot | Out-Null
setx ANDROID_SDK_ROOT $sdkRoot | Out-Null

$packages = @(
  "platform-tools",
  "platforms;android-35",
  "build-tools;35.0.0"
)

# Accept licenses automatically
$yes = New-TemporaryFile
"y`ny`ny`ny`ny`ny`ny`n" | Set-Content -Path $yes.FullName
Get-Content $yes.FullName | & $sdkManager --licenses | Out-Null

& $sdkManager --install $packages --sdk_root=$sdkRoot

Remove-Item $yes.FullName -Force

Write-Host "Android SDK setup completed successfully."
Write-Host "ANDROID_HOME=$sdkRoot"
