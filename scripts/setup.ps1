# Seaversity Ticketing - Development Setup Script (PowerShell)
# This script sets up the development environment

Write-Host "🚀 Seaversity Ticketing - Development Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n📦 Checking Docker..." -ForegroundColor Yellow
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Start database services
Write-Host "`n🐘 Starting PostgreSQL, Redis, and MinIO..." -ForegroundColor Yellow
docker-compose up -d db redis minio
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Services started" -ForegroundColor Green

# Wait for PostgreSQL to be ready
Write-Host "`n⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    $result = docker exec seaversity-db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
        break
    }
    Write-Host "   Attempt $attempt/$maxAttempts - Waiting..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ PostgreSQL failed to start" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "`n🔧 Generating Prisma client..." -ForegroundColor Yellow
pnpm --filter @seaversity/database db:generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# Run migrations
Write-Host "`n🗃️ Running database migrations..." -ForegroundColor Yellow
pnpm --filter @seaversity/database db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations complete" -ForegroundColor Green

# Seed database
Write-Host "`n🌱 Seeding database..." -ForegroundColor Yellow
pnpm --filter @seaversity/database db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Test credentials:" -ForegroundColor Yellow
Write-Host "   Admin: admin@seaversity.edu / admin123" -ForegroundColor White
Write-Host "   Agent: agent@seaversity.edu / agent123" -ForegroundColor White
Write-Host "`n🚀 To start the development server:" -ForegroundColor Yellow
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host "`n🌐 Then open http://localhost:3000" -ForegroundColor Yellow
