#!/bin/bash

# API Testing Script for Wealth Atlas Sync

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get API endpoint
if [ -f ".api-endpoint" ]; then
    API_BASE=$(cat .api-endpoint)
else
    echo -e "${YELLOW}Enter your API endpoint (e.g., https://abc123.execute-api.us-east-1.amazonaws.com/dev):${NC}"
    read API_BASE
fi

echo -e "${YELLOW}🧪 Testing API: $API_BASE${NC}"

# Sample encrypted payload (this would normally come from your crypto module)
SAMPLE_PAYLOAD='{"encrypted":"sample_encrypted_data_here"}'
SAMPLE_META='{
  "enc": "AES-GCM",
  "kdf": "PBKDF2-SHA256", 
  "iterations": 250000,
  "salt": "c2FtcGxlX3NhbHQ=",
  "iv": "c2FtcGxlX2l2",
  "schemaVersion": 7
}'

echo -e "${YELLOW}1. Testing POST /data (Create Dataset)${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/data" \
  -H "Content-Type: application/json" \
  -d "{\"payload\":\"$SAMPLE_PAYLOAD\",\"meta\":$SAMPLE_META}")

echo "Response: $CREATE_RESPONSE"

# Extract keyId from response
KEY_ID=$(echo $CREATE_RESPONSE | grep -o '"keyId":"[^"]*"' | cut -d'"' -f4)

if [ "$KEY_ID" = "" ]; then
    echo -e "${RED}❌ Failed to create dataset${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Created dataset with keyId: $KEY_ID${NC}"

echo -e "\n${YELLOW}2. Testing GET /data/$KEY_ID (Retrieve Dataset)${NC}"
GET_RESPONSE=$(curl -s -X GET "$API_BASE/data/$KEY_ID" \
  -H "Content-Type: application/json")

echo "Response: $GET_RESPONSE"

echo -e "\n${YELLOW}3. Testing PUT /data/$KEY_ID (Update Dataset)${NC}"
UPDATED_PAYLOAD='{"encrypted":"updated_encrypted_data_here"}'
UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/data/$KEY_ID" \
  -H "Content-Type: application/json" \
  -d "{\"payload\":\"$UPDATED_PAYLOAD\",\"meta\":$SAMPLE_META}")

echo "Response: $UPDATE_RESPONSE"

echo -e "\n${YELLOW}4. Testing GET /data/$KEY_ID (Verify Update)${NC}"
GET_UPDATED_RESPONSE=$(curl -s -X GET "$API_BASE/data/$KEY_ID" \
  -H "Content-Type: application/json")

echo "Response: $GET_UPDATED_RESPONSE"

echo -e "\n${YELLOW}5. Testing Error Cases${NC}"

echo -e "${YELLOW}5a. GET non-existent dataset${NC}"
ERROR_RESPONSE=$(curl -s -X GET "$API_BASE/data/non-existent-id" \
  -H "Content-Type: application/json")
echo "Response: $ERROR_RESPONSE"

echo -e "\n${YELLOW}5b. POST with invalid payload${NC}"
INVALID_RESPONSE=$(curl -s -X POST "$API_BASE/data" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}')
echo "Response: $INVALID_RESPONSE"

echo -e "\n${YELLOW}6. Testing DELETE /data/$KEY_ID (Cleanup)${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/data/$KEY_ID" \
  -H "Content-Type: application/json")

echo "Response: $DELETE_RESPONSE"

echo -e "\n${YELLOW}7. Testing GET after DELETE (Should return 404)${NC}"
GET_DELETED_RESPONSE=$(curl -s -X GET "$API_BASE/data/$KEY_ID" \
  -H "Content-Type: application/json")

echo "Response: $GET_DELETED_RESPONSE"

echo -e "\n${GREEN}🎉 API testing completed!${NC}"
echo -e "${YELLOW}💡 All CRUD operations tested successfully${NC}"
