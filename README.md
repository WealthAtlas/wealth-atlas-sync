# Wealth Atlas Sync - Serverless Key-Value Storage API

A simple, serverless key-value storage API built with AWS Lambda and DynamoDB. Designed for client applications that need to store opaque data blobs with automatic versioning and server-generated keys.

## Overview

This service provides a REST API for storing and retrieving data without any assumptions about the data format or encryption. The server treats all data as opaque and handles key generation, versioning, and timestamps automatically.

### Key Features

- **Server-Generated Keys**: UUID v4 keys generated automatically
- **Automatic Versioning**: Server increments version on each update
- **Opaque Data Storage**: Server doesn't inspect or validate data content
- **No Authentication**: Public API for lightweight use cases
- **CORS Enabled**: Ready for web client integration
- **Serverless**: Pay-per-use with AWS Lambda + DynamoDB

## Architecture

- **AWS Lambda** - Serverless compute for API handlers
- **DynamoDB** - NoSQL database for key-value storage with automatic scaling
- **API Gateway** - RESTful HTTP endpoints with CORS support
- **Serverless Framework** - Infrastructure as Code deployment and management

## API Reference

Base URL: `https://your-api-id.execute-api.us-east-1.amazonaws.com/{stage}`

All endpoints return JSON and include proper CORS headers.

### POST /data
Create a new dataset with server-generated key.

**Request Body:**
```json
{
  "payload": "your_data_here",
  "meta": {
    "optional": "metadata_object"
  }
}
```

**Success Response (201):**
```json
{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "updatedAt": "2025-08-22T14:30:00.000Z"
}
```

**Error Responses:**
- `400` - Missing required `payload` field

### GET /data/{keyId}
Retrieve a dataset by its key.

**Success Response (200):**
```json
{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 3,
  "payload": "your_data_here",
  "meta": {
    "optional": "metadata_object"
  },
  "updatedAt": "2025-08-22T14:35:00.000Z"
}
```

**Error Responses:**
- `404` - Dataset not found

### PUT /data/{keyId}
Update an existing dataset (increments version).

**Request Body:** Same as POST

**Success Response (200):**
```json
{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 4,
  "updatedAt": "2025-08-22T14:40:00.000Z"
}
```

**Error Responses:**
- `400` - Missing required `payload` field
- `404` - Dataset not found

### DELETE /data/{keyId}
Delete a dataset permanently.

**Success Response (200):**
```json
{
  "message": "Dataset deleted successfully",
  "keyId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `404` - Dataset not found

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Deploy to AWS
```bash
# Deploy to development
./deploy.sh

# Deploy to production  
./deploy.sh prod
```

### 3. Test the API
```bash
# Test deployed endpoints
./test-api.sh https://your-api-endpoint.amazonaws.com/dev
```

## Development

### Prerequisites
- **AWS CLI** configured with deployment permissions
- **Node.js 18+**
- **pnpm 9.0.0** (specified in package.json)
- **Serverless Framework** (`pnpm add -g serverless`)

### Local Development
```bash
# Build TypeScript
pnpm run build

# Run local API server
pnpm run local
# API available at http://localhost:3000/dev/data

# Test locally (without deployment)
pnpm run test:local
```

### Available Scripts
```bash
pnpm run build        # Build TypeScript to JavaScript
pnpm run deploy       # Deploy to AWS (dev stage)
pnpm run deploy:prod  # Deploy to production stage
pnpm run local        # Start local development server
pnpm run logs         # View Lambda function logs
pnpm run remove       # Remove entire stack from AWS
pnpm run test:local   # Test handler locally with mocks
```

### Testing
- **Local Testing**: `pnpm run test:local` - Tests handler with mocked DynamoDB
- **Integration Testing**: `./test-api.sh <endpoint>` - Tests deployed API endpoints
- **Manual Testing**: Use curl, Postman, or any HTTP client

### Environment Configuration
The service uses stage-based environments:
- **Development**: `wealth-atlas-sync-dev` (default)
- **Production**: `wealth-atlas-sync-prod`

Environment variables (auto-configured):
- `TABLE_NAME`: DynamoDB table name with stage suffix
- `REGION`: AWS region (default: us-east-1)

## Data Model

### DynamoDB Schema
```
Table: wealth-atlas-sync-{stage}
Partition Key: keyId (String) - UUID v4 identifier

Attributes:
- keyId: Server-generated UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- version: Auto-incremented number (starts at 1)
- payload: Your data as string (opaque to server)
- meta: Optional metadata object (can be null)
- updatedAt: ISO 8601 timestamp (server-managed)
```

### Versioning Strategy
- **Server-Managed**: Version numbers automatically increment on updates
- **Last-Writer-Wins**: No conflict resolution - latest update wins
- **Simple**: No merge logic or client-side conflict handling needed

### Data Characteristics
- **Opaque Storage**: Server doesn't validate or interpret payload content
- **Flexible Metadata**: Optional meta field for any additional data
- **Size Limits**: Respect DynamoDB item size limits (400KB max)
- **No Schema**: Payload can contain any string data

## Client Integration

### JavaScript/TypeScript Example
```typescript
class SyncClient {
  constructor(private baseUrl: string) {}

  async create(payload: string, meta?: any) {
    const response = await fetch(`${this.baseUrl}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, meta })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json(); // { keyId, version, updatedAt }
  }

  async get(keyId: string) {
    const response = await fetch(`${this.baseUrl}/data/${keyId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json(); // { keyId, version, payload, meta, updatedAt }
  }

  async update(keyId: string, payload: string, meta?: any) {
    const response = await fetch(`${this.baseUrl}/data/${keyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, meta })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json(); // { keyId, version, updatedAt }
  }

  async delete(keyId: string) {
    const response = await fetch(`${this.baseUrl}/data/${keyId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json(); // { message, keyId }
  }
}

// Usage
const client = new SyncClient('https://your-api.amazonaws.com/prod');
const { keyId } = await client.create('{"user": "data"}', { type: 'user_profile' });
const data = await client.get(keyId);
```

### cURL Examples
```bash
# Create new dataset
curl -X POST https://your-api.amazonaws.com/dev/data \
  -H "Content-Type: application/json" \
  -d '{"payload": "hello world", "meta": {"type": "greeting"}}'

# Get dataset  
curl https://your-api.amazonaws.com/dev/data/YOUR_KEY_ID

# Update dataset
curl -X PUT https://your-api.amazonaws.com/dev/data/YOUR_KEY_ID \
  -H "Content-Type: application/json" \
  -d '{"payload": "updated data", "meta": {"version": 2}}'

# Delete dataset
curl -X DELETE https://your-api.amazonaws.com/dev/data/YOUR_KEY_ID
```

## Security & Operations

### Security Model
- **Public API**: No authentication required (by design)
- **Opaque Data**: Server never inspects or validates payload content
- **CORS Enabled**: Configured for web client access
- **AWS Security**: Data encrypted at rest in DynamoDB
- **Point-in-Time Recovery**: Enabled for data protection

### Cost Estimation
For typical usage (500 requests/month, <10MB storage):
- **Lambda**: FREE (within free tier limits)
- **DynamoDB**: FREE (within free tier limits)  
- **API Gateway**: ~$1.75/month
- **Total**: ~$1.75/month

### Monitoring & Troubleshooting
```bash
# View Lambda logs
pnpm run logs

# Monitor via AWS Console
# CloudWatch → Log Groups → /aws/lambda/wealth-atlas-sync-dev-sync
```

Common issues:
- **CORS errors**: Verify endpoint URL in client
- **404 errors**: Check keyId format and existence
- **400 errors**: Ensure payload field is present
- **500 errors**: Check CloudWatch logs

### Performance Characteristics
- **Cold start**: ~100-500ms for Lambda initialization
- **Warm requests**: ~10-50ms response time
- **Throughput**: Scales automatically with demand
- **Storage**: Unlimited (DynamoDB auto-scaling)

## Project Structure
```
├── src/
│   └── handler.ts          # Main Lambda handler with all endpoints
├── serverless.yml          # Infrastructure configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── deploy.sh              # Deployment automation
├── test-api.sh            # API integration tests
├── test-local.js          # Local testing with mocks
└── README.md              # This documentation
```

## Contributing

### Development Workflow
1. Make changes to `src/handler.ts`
2. Test locally: `pnpm run test:local`
3. Build: `pnpm run build`
4. Deploy: `./deploy.sh`
5. Test integration: `./test-api.sh <endpoint>`

### Code Style
- TypeScript with strict mode enabled
- ESNext modules with Node.js 18+ target
- Explicit error handling with proper HTTP status codes
- Consistent response formats across all endpoints

---

**Note**: This is a simple key-value storage API designed for lightweight use cases. For production applications requiring authentication, advanced features, or high-scale operations, consider more robust solutions.
