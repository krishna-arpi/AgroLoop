$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "node_modules")) {
    npm install
}

$env:DATABASE_URL = "postgresql://agroloop:agroloop@localhost:5432/agroloop?schema=public"
$env:CORS_ORIGIN = "http://localhost:6999"

npm run prisma -- generate
npm run dev
