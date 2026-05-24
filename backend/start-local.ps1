# Start Spring Boot locally with environment variables from local.env

$envFile = "$PSScriptRoot\local.env"

if (-not (Test-Path $envFile)) {
    Write-Error "local.env not found. Copy local.env.example to local.env and fill in your credentials."
    exit 1
}

# Load environment variables from local.env
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $key, $value = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), 'Process')
}

Write-Host "Environment loaded from local.env" -ForegroundColor Green
Write-Host "Starting Spring Boot on http://localhost:8080 ..." -ForegroundColor Cyan

mvn spring-boot:run
