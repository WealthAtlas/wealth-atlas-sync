#!/bin/bash

# Wealth Atlas Sync - Quick Deployment Script

set -e

echo "🚀 Deploying Wealth Atlas Sync Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo -e "${YELLOW}📋 Deployment Info:${NC}"
echo "  AWS Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo "  Stage: ${1:-dev}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

# Deploy using serverless
echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
if [ "$1" = "prod" ]; then
    pnpm exec serverless deploy --stage prod
else
    pnpm exec serverless deploy --stage dev
fi

# Get deployment info
STAGE=${1:-dev}
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='${STAGE}-wealth-atlas-sync'].id" --output text)

if [ "$API_ID" != "" ]; then
    API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 API Endpoint: $API_URL${NC}"
    echo -e "${GREEN}📊 DynamoDB Table: wealth-atlas-sync-${STAGE}${NC}"
    
    # Save endpoint to a file for easy reference
    echo "$API_URL" > .api-endpoint
    
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "  1. Update your frontend config with: $API_URL"
    echo "  2. Test the API: curl $API_URL/data"
    echo "  3. View logs: npm run logs"
else
    echo -e "${RED}❌ Could not determine API endpoint. Check deployment manually.${NC}"
fi

echo -e "${GREEN}🎉 Ready to sync!${NC}"
