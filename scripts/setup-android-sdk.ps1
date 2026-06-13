#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ToolsDir = Join-Path $Root "tools"
$JdkDir = Join-Path $ToolsDir "jdk-21"
$SdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"

Write-Host "Dad Bod Android SDK setup" -ForegroundColor Cyan

function Ensure-Dir([string]$Path) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Ensure-PortableJdk {
    $javaExe = Join-Path $JdkDir "bin\java.exe"
    if (Test-Path $javaExe) {
        return $JdkDir
    }

    Ensure-Dir $ToolsDir
    Write-Host "Downloading portable Microsoft OpenJDK 21..." -ForegroundColor Yellow
    $zipUrl = "https://aka.ms/download-jdk/microsoft-jdk-21.0.7-windows-x64.zip"
    $zipPath = Join-Path $env:TEMP "microsoft-jdk-21.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    $extractRoot = Join-Path $env:TEMP "microsoft-jdk-21"
    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force
    $inner = Get-ChildItem $extractRoot -Directory | Select-Object -First 1
    if (-not $inner) { throw "Portable JDK archive was empty." }
    if (Test-Path $JdkDir) { Remove-Item $JdkDir -Recurse -Force }
    Move-Item $inner.FullName $JdkDir
    return $JdkDir
}

$javaHome = Ensure-PortableJdk
$javaBin = Join-Path $javaHome "bin"
$env:JAVA_HOME = $javaHome
$env:Path = "$javaBin;" + $env:Path
Write-Host ("JAVA_HOME=" + $javaHome)

Ensure-Dir $SdkRoot
$cmdlineRoot = Join-Path $SdkRoot "cmdline-tools"
$latestTools = Join-Path $cmdlineRoot "latest"
Ensure-Dir $latestTools

$sdkmanager = Join-Path $latestTools "bin\sdkmanager.bat"
if (-not (Test-Path $sdkmanager)) {
    Write-Host "Downloading Android command-line tools..." -ForegroundColor Yellow
    $zipUrl = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"
    $zipPath = Join-Path $env:TEMP "android-cmdline-tools.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    $extractPath = Join-Path $env:TEMP "android-cmdline-tools"
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    $inner = Join-Path $extractPath "cmdline-tools"
    Get-ChildItem $inner | Copy-Item -Destination $latestTools -Recurse -Force
}

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$platformTools = Join-Path $SdkRoot "platform-tools"
$sdkmanagerBin = Join-Path $latestTools "bin"
$env:Path = "$platformTools;$sdkmanagerBin;" + $env:Path

Write-Host "Installing SDK packages..." -ForegroundColor Yellow
$packages = @(
    'platform-tools',
    'platforms;android-36',
    'build-tools;36.0.0'
)

foreach ($pkg in $packages) {
    Write-Host ("  -> " + $pkg)
    cmd /c "echo y| `"$sdkmanager`" --install `"$pkg`""
}

$profilePath = Join-Path $Root ".android-env.ps1"
@(
    ('$env:JAVA_HOME = "' + $javaHome + '"'),
    ('$env:ANDROID_HOME = "' + $SdkRoot + '"'),
    ('$env:ANDROID_SDK_ROOT = "' + $SdkRoot + '"'),
    ('$env:Path = "' + $javaBin + ';' + $platformTools + ';' + $sdkmanagerBin + ';" + $env:Path')
) | Set-Content -Path $profilePath -Encoding UTF8

Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run: npm run build:android" -ForegroundColor Green
