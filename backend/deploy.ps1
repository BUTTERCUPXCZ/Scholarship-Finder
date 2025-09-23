# Production Deployment Script for Windows PowerShell
# This script handles the deployment of the backend to production

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.production template and fill in your production values." -ForegroundColor Yellow
    exit 1
}

try {
    # Build the application
    Write-Host "📦 Building application..." -ForegroundColor Blue
    npm run build

    # Run database migrations
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Blue
    npm run prisma:deploy

    # Generate Prisma client
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Blue
    npm run prisma:generate

    # Build Docker image
    Write-Host "🐳 Building Docker image..." -ForegroundColor Blue
    docker build -t scholarship-backend:latest .

    # Optional: Push to registry
    # Write-Host "📤 Pushing to registry..." -ForegroundColor Blue
    # docker tag scholarship-backend:latest your-registry/scholarship-backend:latest
    # docker push your-registry/scholarship-backend:latest

    # Start the production services
    Write-Host "🏃 Starting production services..." -ForegroundColor Blue
    docker-compose -f docker-compose.yml up -d

    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Application is running at http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔍 Health check: http://localhost:3000/health" -ForegroundColor Cyan

    # Show running containers
    Write-Host "📊 Running containers:" -ForegroundColor Blue
    docker-compose ps
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}