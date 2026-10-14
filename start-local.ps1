$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$workspaceNodeDirectory = Join-Path $PSScriptRoot '.tools/node-v22.14.0-win-x64'
if (Test-Path -LiteralPath (Join-Path $workspaceNodeDirectory 'node.exe')) {
    $env:Path = $workspaceNodeDirectory + ';' + $env:Path
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Install Node.js 22 LTS or newer, then rerun this script.'
}
if (-not (Test-Path -LiteralPath 'node_modules')) {
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
& npm.cmd run dev
