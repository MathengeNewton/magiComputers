#!/bin/bash
set -e

echo "🚀 Building and deploying MagiComputers stack..."
echo ""

cd "$(dirname "$0")"

# Load port overrides from .env if present
[ -f .env ] && set -a && . ./.env && set +a

echo "📦 Building images..."
docker compose build

echo ""
echo "🚀 Deploying containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "📋 Service status:"
docker compose ps

echo ""
echo "✅ Build and deploy complete!"
echo ""
echo "  API:   http://localhost:${API_PORT:-7000}"
echo "  Admin: http://localhost:${ADMIN_PORT:-7001}"
echo "  Shop:  http://localhost:${SHOP_PORT:-7002}"
echo ""
