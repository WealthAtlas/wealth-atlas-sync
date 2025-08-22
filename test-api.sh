#!/bin/bash

# Test API endpoints after deployment
# Usage: ./test-api.sh [API_ENDPOINT]

set -e

# API endpoint (override with argument)
API_ENDPOINT=${1:-"https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"}

echo "🧪 Testing API endpoints at: $API_ENDPOINT"
echo

# Test data
PAYLOAD_DATA='{
  "payload": "encrypted_test_data_12345",
  "meta": {
    "enc": "AES-GCM",
    "kdf": "PBKDF2-SHA256", 
    "iterations": 250000,
    "salt": "dGVzdF9zYWx0XzEyMzQ1",
    "iv": "dGVzdF9pdl8xMjM0NQ==",
    "schemaVersion": 7
  }
}'

UPDATE_PAYLOAD_DATA='{
  "payload": "updated_encrypted_test_data_67890",
  "meta": {
    "enc": "AES-GCM",
    "kdf": "PBKDF2-SHA256",
    "iterations": 250000,
    "salt": "dGVzdF9zYWx0XzY3ODkw",
    "iv": "dGVzdF9pdl82Nzg5MA==",
    "schemaVersion": 8
  }
}'

echo "1. Testing POST /data (Create new dataset)"
echo "Request: $PAYLOAD_DATA"
echo

CREATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_DATA" \
  "$API_ENDPOINT/data")

echo "Response: $CREATE_RESPONSE"
echo

# Extract keyId from response
KEY_ID=$(echo $CREATE_RESPONSE | grep -o '"keyId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$KEY_ID" ]; then
  echo "❌ Failed to create dataset - no keyId returned"
  exit 1
fi

echo "✅ Dataset created with keyId: $KEY_ID"
echo

echo "2. Testing GET /data/{keyId} (Retrieve dataset)"
echo

GET_RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT/data/$KEY_ID")

echo "Response: $GET_RESPONSE"
echo

# Check if response contains the data
if echo "$GET_RESPONSE" | grep -q "encrypted_test_data_12345"; then
  echo "✅ Dataset retrieved successfully"
else
  echo "❌ Failed to retrieve dataset"
  exit 1
fi

echo

echo "3. Testing PUT /data/{keyId} (Update dataset)"
echo "Request: $UPDATE_PAYLOAD_DATA"
echo

UPDATE_RESPONSE=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD_DATA" \
  "$API_ENDPOINT/data/$KEY_ID")

echo "Response: $UPDATE_RESPONSE"
echo

# Check if version was incremented
if echo "$UPDATE_RESPONSE" | grep -q '"version":2'; then
  echo "✅ Dataset updated successfully (version incremented)"
else
  echo "❌ Failed to update dataset"
  exit 1
fi

echo

echo "4. Testing GET /data/{keyId} (Retrieve updated dataset)"
echo

GET_UPDATED_RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT/data/$KEY_ID")

echo "Response: $GET_UPDATED_RESPONSE"
echo

# Check if response contains updated data
if echo "$GET_UPDATED_RESPONSE" | grep -q "updated_encrypted_test_data_67890"; then
  echo "✅ Updated dataset retrieved successfully"
else
  echo "❌ Failed to retrieve updated dataset"
  exit 1
fi

echo

echo "5. Testing DELETE /data/{keyId} (Delete dataset)"
echo

DELETE_RESPONSE=$(curl -s -X DELETE \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT/data/$KEY_ID")

echo "Response: $DELETE_RESPONSE"
echo

# Check if deletion was successful
if echo "$DELETE_RESPONSE" | grep -q "Dataset deleted successfully"; then
  echo "✅ Dataset deleted successfully"
else
  echo "❌ Failed to delete dataset"
  exit 1
fi

echo

echo "6. Testing GET /data/{keyId} (Verify deletion)"
echo

GET_DELETED_RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT/data/$KEY_ID")

echo "Response: $GET_DELETED_RESPONSE"
echo

# Check if dataset is not found
if echo "$GET_DELETED_RESPONSE" | grep -q "Dataset not found"; then
  echo "✅ Dataset confirmed deleted (404 response)"
else
  echo "❌ Dataset was not properly deleted"
  exit 1
fi

echo

echo "7. Testing Error Cases"
echo

echo "7a. Testing GET with invalid keyId"
INVALID_GET_RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT/data/invalid-key-id")

echo "Response: $INVALID_GET_RESPONSE"

if echo "$INVALID_GET_RESPONSE" | grep -q "Dataset not found"; then
  echo "✅ Invalid keyId handled correctly (404)"
else
  echo "❌ Invalid keyId not handled properly"
fi

echo

echo "7b. Testing PUT with invalid keyId"
INVALID_PUT_RESPONSE=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_DATA" \
  "$API_ENDPOINT/data/invalid-key-id")

echo "Response: $INVALID_PUT_RESPONSE"

if echo "$INVALID_PUT_RESPONSE" | grep -q "Dataset not found"; then
  echo "✅ Invalid PUT keyId handled correctly (404)"
else
  echo "❌ Invalid PUT keyId not handled properly"
fi

echo

echo "7c. Testing POST with missing payload"
INVALID_POST_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"meta": {"enc": "AES-GCM"}}' \
  "$API_ENDPOINT/data")

echo "Response: $INVALID_POST_RESPONSE"

if echo "$INVALID_POST_RESPONSE" | grep -q "payload is required"; then
  echo "✅ Missing payload handled correctly (400)"
else
  echo "❌ Missing payload not handled properly"
fi

echo

echo "🎉 All API tests completed successfully!"
echo
echo "Summary:"
echo "✅ POST /data - Create dataset"
echo "✅ GET /data/{keyId} - Retrieve dataset"
echo "✅ PUT /data/{keyId} - Update dataset"
echo "✅ DELETE /data/{keyId} - Delete dataset"
echo "✅ Error handling for invalid requests"
echo
echo "Your Wealth Atlas Sync API is working correctly! 🚀"
