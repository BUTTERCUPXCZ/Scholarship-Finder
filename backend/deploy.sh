#!/bin/bash

# Production Deployment Script
# This script handles the deployment of the backend to production

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production template and fill in your production values."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run prisma:deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t scholarship-backend:latest .

# Optional: Push to registry
# echo "📤 Pushing to registry..."
# docker tag scholarship-backend:latest your-registry/scholarship-backend:latest
# docker push your-registry/scholarship-backend:latest

# Start the production services
echo "🏃 Starting production services..."
docker-compose -f docker-compose.yml up -d

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at http://localhost:3000"
echo "🔍 Health check: http://localhost:3000/health"

# Show running containers
echo "📊 Running containers:"
docker-compose ps