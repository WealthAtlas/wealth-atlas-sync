#!/bin/bash

set -e

echo "🚀 Deploying Wealth Atlas Sync..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Deploy
STAGE=${1:-dev}
echo "🏗️ Deploying to stage: $STAGE"
pnpm exec serverless deploy --stage $STAGE

echo "✅ Deployment complete!"
