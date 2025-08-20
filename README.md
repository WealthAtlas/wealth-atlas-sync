# Wealth Atlas Sync - AWS Lambda Backend

A serverless sync service for Wealth Atlas using AWS Lambda + DynamoDB.

## Architecture

- **AWS Lambda** - Serverless compute for handling API requests
- **DynamoDB** - NoSQL database for storing encrypted sync data
- **API Gateway** - RESTful API endpoints with CORS support
- **Serverless Framework** - Infrastructure as Code deployment

## API Endpoints

All endpoints support CORS and expect/return JSON.

### POST /data
Create a new encrypted dataset.

**Request:**
```json
{
  "payload": "encrypted_json_string",
  "meta": {
    "enc": "AES-GCM",
    "kdf": "PBKDF2-SHA256",
    "iterations": 250000,
    "salt": "base64_string",
    "iv": "base64_string",
    "schemaVersion": 7
  }
}
```

**Response (201):**
```json
{
  "keyId": "uuid-v4",
  "version": 1,
  "updatedAt": "2025-08-20T10:30:00.000Z"
}
```

### GET /data/{keyId}
Retrieve the latest version of a dataset.

**Response (200):**
```json
{
  "keyId": "uuid-v4",
  "version": 3,
  "payload": "encrypted_json_string",
  "meta": {
    "enc": "AES-GCM",
    "kdf": "PBKDF2-SHA256",
    "iterations": 250000,
    "salt": "base64_string",
    "iv": "base64_string",
    "schemaVersion": 7
  },
  "updatedAt": "2025-08-20T10:35:00.000Z"
}
```

### PUT /data/{keyId}
Update an existing dataset (increments version).

**Request:** Same as POST
**Response (200):**
```json
{
  "keyId": "uuid-v4",
  "version": 4,
  "updatedAt": "2025-08-20T10:40:00.000Z"
}
```

### DELETE /data/{keyId}
Delete a dataset permanently.

**Response (200):**
```json
{
  "message": "Dataset deleted successfully",
  "keyId": "uuid-v4"
}
```

## Cost Analysis

For typical usage (500 requests/month, <10MB data):

- **Lambda**: FREE (within free tier: 1M requests + 400K GB-seconds)
- **DynamoDB**: FREE (within free tier: 25GB storage + 25 RCU/WCU)
- **API Gateway**: ~$1.75/month (500 requests × $3.50/million)
- **Total**: ~$1.75/month

## Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Node.js 18+** 
3. **pnpm** package manager
4. **Serverless Framework**

```bash
pnpm add -g serverless
```

### Install Dependencies

```bash
pnpm install
```

### Deploy to AWS

```bash
# Deploy to dev stage (default)
pnpm run deploy

# Deploy to production
pnpm run deploy:prod
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start local API server
pnpm run local
```

The API will be available at `http://localhost:3000/dev/data`

### Environment Variables

The Lambda function uses these environment variables (automatically configured):

- `TABLE_NAME` - DynamoDB table name
- `REGION` - AWS region

### Logs and Monitoring

```bash
# View function logs
pnpm run logs

# Deploy single function (faster)
pnpm run deploy:function

# Remove entire stack
pnpm run remove
```

## Security Features

1. **Client-side Encryption**: All data is encrypted before reaching the server
2. **CORS Protection**: Properly configured CORS headers
3. **Input Validation**: Strict validation of crypto metadata
4. **No Server-side Decryption**: Server never sees unencrypted data
5. **DynamoDB Encryption**: Data encrypted at rest by AWS
6. **Point-in-Time Recovery**: Enabled for data protection

## Error Handling

- **400 Bad Request**: Invalid input or missing required fields
- **404 Not Found**: Dataset doesn't exist
- **409 Conflict**: Dataset already exists (POST only)
- **500 Internal Server Error**: Server-side errors

## Data Model

### DynamoDB Table Schema

```
KeyId (String, Partition Key) - UUID v4 identifier
Version (Number) - Incremented on each update
Payload (String) - Encrypted JSON blob
Meta (Object) - Crypto metadata (non-secret)
UpdatedAt (String) - ISO timestamp
```

### Last-Writer-Wins Conflict Resolution

- Each update increments the version number
- Clients can compare versions to detect conflicts
- No automatic conflict resolution - clients handle merging

## Frontend Integration

Update your frontend sync service to use the deployed API:

```typescript
// src/data/sync/config.ts
export const SYNC_API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
    : 'http://localhost:3000/dev';
```

## Monitoring and Troubleshooting

### CloudWatch Logs
All Lambda executions are logged to CloudWatch. View logs via:
- AWS Console → CloudWatch → Log Groups
- `npm run logs` command

### Common Issues

1. **CORS Errors**: Ensure frontend uses correct API endpoint
2. **Validation Errors**: Check crypto metadata format
3. **Timeout**: Increase Lambda timeout if needed (currently 30s)
4. **Memory**: Increase Lambda memory if needed (currently 256MB)

### Performance Tuning

For higher loads, consider:
- **DynamoDB Provisioned Capacity**: More predictable performance
- **Lambda Provisioned Concurrency**: Reduced cold starts
- **CloudFront**: Global CDN for API endpoints
