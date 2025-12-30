#!/bin/bash

# Production startup script for Acquisition App with Neon Local
# This script starts the application in production mode with Neon Local

echo "🚀 Starting Acquisition App in Production Mode"
echo "================================================"

#  Check if .env.production exits
if [ ! -f .env.production ]; then
  echo"❌ Error: .env.production file not found!"
  echo "   Please copy .env.production fron the template and undate with your Neon credentials."
  exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌Error: Docker is not running!"
  echo "   Please start Docker Desktop and try again"
  exit 1
fi

echo "📦 Building and starting production containers..."
echo "    - Using Neon Cloud Database (no local proxy)"
echo "    - Running in optimized production mode"
echo ""

# Start production environment
docker compose -f docker-compose.prod.yml up --build -d

# Wait for DB to be ready (basic health check)
echo "⏳ Waiting for Neon Local to be ready..."\
sleep 5

# Run migration with Drizzle
echo "📜 Applying latest schema with Drizzle..."
npm run db:migrate


echo ""
echo "🎉 Production environment started!"
echo "    Application: http://localhost:3000"
echo "    Logs: docker logs acquisition-app-prod"
echo ""
echo "Useful commands:"
echo "    View logs: docker logs -f acquisition-app-prod"
echo "    Stop app: docker compose -f docker-compose.prod.yml down"