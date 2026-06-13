#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $Root "android"
$ReleaseDir = Join-Path $Root "release"
$Version = (Get-Content (Join-Path $Root "package.json") -Raw | ConvertFrom-Json).version
$KeystorePath = Join-Path $ReleaseDir "dadbod-release.keystore"
$KeystoreProps = Join-Path $AndroidDir "keystore.properties"

$StorePass = $env:DADBOD_STORE_PASSWORD
if (-not $StorePass) { $StorePass = "DadBodStore2026!" }
$KeyPass = $env:DADBOD_KEY_PASSWORD
if (-not $KeyPass) { $KeyPass = $StorePass }

function Import-AndroidEnv {
    $envFile = Join-Path $Root ".android-env.ps1"
    if (Test-Path $envFile) {
        . $envFile
        return
    }

    $javaCandidates = @(
        $env:JAVA_HOME,
        (Join-Path $Root "tools\jdk-21"),
        "C:\Program Files\Microsoft\jdk-21*",
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Microsoft\jdk-17*",
        "C:\Program Files\Eclipse Adoptium\jdk-17*"
    ) | Where-Object { $_ }

    foreach ($candidate in $javaCandidates) {
        $resolved = Get-Item $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($resolved -and (Test-Path (Join-Path $resolved.FullName "bin\java.exe"))) {
            $env:JAVA_HOME = $resolved.FullName
            break
        }
    }

    if (-not $env:ANDROID_HOME) {
        $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
        if (Test-Path $defaultSdk) {
            $env:ANDROID_HOME = $defaultSdk
            $env:ANDROID_SDK_ROOT = $defaultSdk
        }
    }

    if ($env:JAVA_HOME) {
        $javaBin = Join-Path $env:JAVA_HOME "bin"
        $env:Path = "$javaBin;" + $env:Path
    }
    if ($env:ANDROID_HOME) {
        $platformTools = Join-Path $env:ANDROID_HOME "platform-tools"
        $cmdline = Join-Path $env:ANDROID_HOME "cmdline-tools\latest\bin"
        $env:Path = "$platformTools;$cmdline;" + $env:Path
    }
}

Write-Host ("Dad Bod Android release build v" + $Version) -ForegroundColor Cyan

$platformDir = Join-Path $env:LOCALAPPDATA "Android\Sdk\platforms\android-36"
if (-not (Test-Path $platformDir)) {
    Write-Host "Android SDK not ready. Running setup-android-sdk.ps1 first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup-android-sdk.ps1")
}

Import-AndroidEnv

$keytool = Join-Path $env:JAVA_HOME "bin\keytool.exe"
if (-not $env:JAVA_HOME -or -not (Test-Path $keytool)) {
    throw "JAVA_HOME is not configured. Run scripts/setup-android-sdk.ps1 first."
}

if (-not $env:ANDROID_HOME) {
    throw "ANDROID_HOME is not configured. Run scripts/setup-android-sdk.ps1 first."
}

if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}

if (-not (Test-Path $KeystorePath)) {
    Write-Host ("Generating release keystore at " + $KeystorePath) -ForegroundColor Yellow
    & $keytool -genkeypair -v `
        -keystore $KeystorePath `
        -alias dadbod `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $StorePass -keypass $KeyPass `
        -dname "CN=Satvik Pandey, OU=Dad Bod, O=Dad Bod, L=India, ST=India, C=IN"
}

$storeFileRelative = "../release/dadbod-release.keystore"
@(
    ("storeFile=" + $storeFileRelative),
    ("storePassword=" + $StorePass),
    "keyAlias=dadbod",
    ("keyPassword=" + $KeyPass)
) | Set-Content -Path $KeystoreProps -Encoding ASCII

Push-Location $Root
try {
    Write-Host "Building web dist..." -ForegroundColor Yellow
    npm run build:dist
    if ($LASTEXITCODE -ne 0) { throw "build:dist failed" }

    Write-Host "Syncing Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }

    $splashPng = Join-Path $AndroidDir "app\src\main\res\drawable\splash.png"
    if (Test-Path $splashPng) {
        Remove-Item $splashPng -Force
    }

    Push-Location $AndroidDir
    try {
        Write-Host "Assembling release APK/AAB..." -ForegroundColor Yellow
        & .\gradlew.bat assembleRelease bundleRelease --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "Gradle release build failed" }
    }
    finally {
        Pop-Location
    }

    $apkSource = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
    $aabSource = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab"

    if (-not (Test-Path $apkSource)) { throw ("Release APK not found at " + $apkSource) }
    if (-not (Test-Path $aabSource)) { throw ("Release AAB not found at " + $aabSource) }

    $apkDest = Join-Path $ReleaseDir ("DadBod-v" + $Version + "-signed.apk")
    $aabDest = Join-Path $ReleaseDir ("DadBod-v" + $Version + "-signed.aab")
    $apkLatest = Join-Path $ReleaseDir "DadBod-latest-signed.apk"
    $aabLatest = Join-Path $ReleaseDir "DadBod-latest-signed.aab"

    Copy-Item $apkSource $apkDest -Force
    Copy-Item $aabSource $aabDest -Force
    Copy-Item $apkSource $apkLatest -Force
    Copy-Item $aabSource $aabLatest -Force

    Write-Host ""
    Write-Host "Release build complete:" -ForegroundColor Green
    Write-Host ("  " + $apkDest)
    Write-Host ("  " + $aabDest)
    Write-Host ("  " + $apkLatest)
    Write-Host ("  " + $aabLatest)
    Write-Host ""
    Write-Host "Upload the .aab file to Google Play Console." -ForegroundColor Cyan
}
finally {
    Pop-Location
}
