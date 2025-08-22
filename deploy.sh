#!/bin/bash

# Deploy Wealth Atlas Sync Service
# Usage: ./deploy.sh [stage]

set -e

STAGE=${1:-dev}

echo "🚀 Deploying Wealth Atlas Sync to stage: $STAGE"
echo

# Build TypeScript
echo "📦 Building TypeScript..."
pnpm run build

# Deploy with Serverless
echo "☁️  Deploying to AWS..."
pnpm run deploy --stage $STAGE

echo
echo "✅ Deployment completed!"
echo

# Get the API endpoint
echo "📋 Getting deployment info..."
API_ENDPOINT=$(serverless info --stage $STAGE --verbose | grep -o 'https://[^/]*/[^/]*' | head -1)

if [ ! -z "$API_ENDPOINT" ]; then
  echo
  echo "🌐 API Endpoint: $API_ENDPOINT"
  echo
  echo "🧪 To test the API, run:"
  echo "   ./test-api.sh $API_ENDPOINT"
  echo
else
  echo "⚠️  Could not extract API endpoint. Check serverless info manually."
fi

echo "🎉 Ready to sync!"
