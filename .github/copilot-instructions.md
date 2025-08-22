# GitHub Copilot Instructions for Wealth Atlas Sync Service

## Project Overview

**Wealth Atlas Sync** is a simple serverless key-value storage API built with AWS Lambda and DynamoDB. It provides opaque data storage with server-generated keys, automatic versioning, and timestamp management for lightweight client applications.

### Core Technology Stack

- **AWS Lambda** - Serverless compute platform for API handlers
- **DynamoDB** - NoSQL database for key-value storage with auto-scaling
- **API Gateway** - RESTful API with CORS support for web clients
- **Serverless Framework** - Infrastructure as Code deployment and management
- **Node.js 18+** - JavaScript runtime with modern features
- **TypeScript** - Type-safe development with strict mode
- **AWS SDK v3** - Modern AWS service clients

### Package Manager

- **pnpm 9.0.0** - Preferred package manager (specified in `package.json` as `packageManager`)

## Core Design Principles

### 1. Simplicity First

- **Single Purpose**: Simple key-value storage with no complex features
- **Minimal Dependencies**: Only essential AWS services and minimal npm packages
- **Clear API**: RESTful endpoints with consistent response formats
- **No Magic**: Explicit behavior, no hidden complexity

### 2. Server-Managed Operations

- **Key Generation**: Server generates UUID v4 keys automatically
- **Version Management**: Server increments version numbers on updates
- **Timestamp Tracking**: Server manages `updatedAt` timestamps
- **Opaque Data**: Server never inspects or validates payload content

### 3. No Authentication by Design

- **Public API**: Anyone can create, read, update, delete data
- **Lightweight Use**: Designed for non-sensitive, ephemeral data
- **Simple Integration**: No OAuth, API keys, or complex auth flows
- **Cost Effective**: Minimal overhead for simple storage needs

### 4. AWS Best Practices

- **Serverless Design**: Stateless functions with proper resource management
- **DynamoDB Optimization**: Simple key design with pay-per-request billing
- **Error Handling**: Proper AWS SDK error handling with meaningful status codes
- **CORS Configuration**: Proper headers for web client integration

## Architecture Principles

### Single Handler Pattern

The service follows a simple single-handler architecture for maintainability:

```
src/
└── handler.ts           # Single Lambda handler with all API endpoints
serverless.yml           # Infrastructure as Code configuration
deploy.sh               # Deployment automation script
test-api.sh             # API integration testing script
test-local.js           # Local testing with mocked DynamoDB
```

### Key Architectural Rules

1. **Single Handler File** (`src/handler.ts`)
   - All API endpoints in one file for simplicity
   - Clear function separation for each HTTP method
   - Shared utilities for common operations (response formatting, error handling)
   - Consistent patterns across all endpoints

2. **DynamoDB Design**
   - Single table design with `keyId` as partition key
   - Server-side versioning for simple conflict resolution
   - Automatic timestamp management
   - Pay-per-request billing for cost optimization

3. **Serverless Configuration** (`serverless.yml`)
   - Stage-based deployments (dev/prod)
   - Proper IAM roles with minimal required permissions
   - CORS configuration for web clients
   - Resource naming with stage suffixes

### API Contract (RESTful Key-Value Storage)

The service implements a simple key-value storage model:

- `POST /data` → Create new dataset, returns `{ keyId, version: 1, updatedAt }`
- `GET /data/{keyId}` → Retrieve dataset, returns `{ keyId, version, payload, meta, updatedAt }`
- `PUT /data/{keyId}` → Update dataset, server increments version automatically
- `DELETE /data/{keyId}` → Remove dataset, returns confirmation message

### Data Model

- **Opaque Storage** - Server stores payload as-is without inspection
- **Optional Metadata** - Meta field for any additional client data
- **Server-Managed Fields** - keyId, version, updatedAt handled by server
- **No Validation** - Server only validates JSON structure, not content

## Code Quality Standards

- **TypeScript Strict Mode** - Full type safety with strict compiler options
- **Modern JavaScript** - ES2020 features with Node.js 18+ runtime
- **Clean Code Practices** - Clear function names, minimal complexity
- **Error Handling** - Comprehensive error handling with proper HTTP status codes
- **Consistent Responses** - Uniform JSON response format across all endpoints

### Testing Strategy

- **Local Testing** - Use `test-local.js` for rapid development with mocked DynamoDB
- **Integration Testing** - Use `test-api.sh` for comprehensive endpoint testing
- **Manual Testing** - Simple curl commands for quick verification

## Development Patterns

### Handler Function Pattern

The main handler follows a clear routing pattern:

```typescript
export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME!;

  try {
    // Route handling with clear resource and method matching
    if (event.httpMethod === 'POST' && event.resource === '/data') {
      return await createData(event, tableName);
    }
    
    if (event.httpMethod === 'GET' && event.resource === '/data/{keyId}') {
      return await getData(event, tableName);
    }
    
    // ... other routes
    
    return response(400, { error: 'Unsupported method or path' });
  } catch (err) {
    console.error('Handler error:', err);
    return response(500, { error: 'Internal Server Error' });
  }
};
```

### Individual Endpoint Pattern

Each endpoint function follows a consistent pattern:

```typescript
async function createData(event: any, tableName: string) {
  try {
    // 1. Parse and validate input
    const body = JSON.parse(event.body || '{}');
    if (!body.payload) {
      return response(400, { error: 'payload is required' });
    }

    // 2. Server-managed data
    const keyId = crypto.randomUUID();
    const version = 1;
    const updatedAt = new Date().toISOString();

    // 3. Database operation
    const item = { keyId, version, payload: body.payload, meta: body.meta || null, updatedAt };
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(keyId)"
    }));

    // 4. Consistent response
    return response(201, { keyId, version, updatedAt });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(409, { error: 'Dataset already exists' });
    }
    throw error;
  }
}
```

### Error Handling Pattern

Consistent error handling across all endpoints:

```typescript
function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body),
  };
}
```

### DynamoDB Operation Pattern

Standardized database operations:

```typescript
// Create with conditional check
await docClient.send(new PutCommand({
  TableName: tableName,
  Item: item,
  ConditionExpression: "attribute_not_exists(keyId)"
}));

// Update with version increment
await docClient.send(new UpdateCommand({
  TableName: tableName,
  Key: { keyId },
  UpdateExpression: "SET version = version + :inc, payload = :payload, meta = :meta, updatedAt = :updatedAt",
  ExpressionAttributeValues: {
    ":inc": 1,
    ":payload": body.payload,
    ":meta": body.meta || null,
    ":updatedAt": updatedAt
  },
  ConditionExpression: "attribute_exists(keyId)",
  ReturnValues: "ALL_NEW"
}));
```

## Development Workflow

### Scripts Usage

- `pnpm run build` - Build and optimize TypeScript to JavaScript for deployment (minified, externalized aws-sdk)
- `pnpm run deploy` - Deploy to AWS (dev stage by default)
- `pnpm run deploy:prod` - Deploy to production environment
- `pnpm run local` - Run serverless offline for local development
- `pnpm run logs` - View Lambda function logs in CloudWatch
- `pnpm run remove` - Remove serverless stack from AWS
- `pnpm run test:local` - Test handler locally with mocked DynamoDB
- `./deploy.sh [stage]` - Automated deployment with endpoint extraction
- `./test-api.sh <endpoint>` - Test deployed API endpoints

### Build Optimization

The build process is optimized for Lambda deployment:

```bash
# Optimized esbuild configuration
esbuild src/handler.ts --bundle --platform=node --target=node18 --outdir=dist --minify --external:aws-sdk
```

Key optimizations:
- **Minification**: Reduces bundle size significantly
- **External aws-sdk**: Excludes AWS SDK (available in Lambda runtime)
- **Bundle size**: Typically ~500KB (well under Lambda limits)

### Deployment Packaging

The serverless configuration excludes unnecessary files:

```yaml
package:
  patterns:
    - '!node_modules/**'
    - '!src/**'
    - '!test-*'
    - '!*.md'
    - '!.git/**'
    - '!.github/**'
    - '!.serverless/**'
    - 'dist/handler.js'
```

This ensures only the built handler is deployed, keeping package size minimal.

### Local Development Workflow

1. **Development** - Test locally with `pnpm run test:local` (no AWS needed)
2. **Build** - Compile and optimize TypeScript with `pnpm run build`
3. **Deploy** - Deploy to dev with `./deploy.sh`
4. **Integration Test** - Test endpoints with `./test-api.sh <endpoint>`
5. **Production** - Deploy to prod with `./deploy.sh prod`

### Directory Structure

```
wealth-atlas-sync/
├── src/
│   └── handler.ts          # Main Lambda handler (TypeScript)
├── dist/
│   └── handler.js          # Built and optimized JavaScript (deployment artifact)
├── .github/
│   └── copilot-instructions.md
├── serverless.yml          # Infrastructure configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── deploy.sh              # Deployment automation
├── test-api.sh            # API integration tests
├── test-local.js          # Local testing with mocks
└── README.md              # User documentation
```

## Key-Value Storage Patterns

### Simple CRUD Operations

The service implements basic CRUD operations without complex features:

1. **Create (POST)** - Server generates UUID, sets version=1, stores data
2. **Read (GET)** - Retrieve data by keyId with current version and metadata
3. **Update (PUT)** - Increment version, update data and timestamp
4. **Delete (DELETE)** - Remove data completely

### Data Storage Model

**Item Structure** (DynamoDB):
```json
{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 3,
  "payload": "any_string_data_here",
  "meta": { "optional": "metadata_object" },
  "updatedAt": "2025-08-22T14:30:00.000Z"
}
```

**API Response Structure**:
```json
{
  "keyId": "uuid-v4",
  "version": 1,
  "updatedAt": "iso-timestamp"
}
```

### Versioning Strategy

- **Server-Managed**: Version numbers start at 1 and increment automatically
- **No Conflicts**: Last writer wins, no merge logic or client conflict resolution
- **Simple Tracking**: Clients can compare version numbers to detect changes
- **Atomic Updates**: DynamoDB conditional updates ensure consistency

## AI Coding Guidelines

### When Adding New Features

1. **Maintain Simplicity** - Add features following the established simple patterns
2. **Single Handler** - Keep all endpoints in the same handler file
3. **Consistent Responses** - Use the same response format and error handling
4. **Test Locally First** - Use `test-local.js` for rapid development iteration
5. **Integration Test** - Deploy and test with `test-api.sh` before production

### When Modifying Existing Code

1. **Preserve Patterns** - Maintain the established coding patterns and structure
2. **Update Tests** - Ensure both local and API tests pass after changes
3. **Backward Compatibility** - Consider existing client applications when changing APIs
4. **Simple First** - Prefer simple solutions over complex optimizations

### Common Development Tasks

#### Adding a New API Endpoint

1. Add route handling in main `handler` function with resource and method check
2. Create dedicated handler function following the established pattern
3. Implement proper input validation for required fields
4. Add DynamoDB operations with appropriate error handling
5. Return consistent response format with proper HTTP status codes
6. Update `test-api.sh` with new endpoint tests

#### Modifying Response Format

1. Update the response structure consistently across all endpoints
2. Test both success and error response scenarios
3. Update API documentation in README.md
4. Consider backward compatibility impact on existing clients

#### Changing DynamoDB Schema

1. Consider backward compatibility with existing data
2. Update all CRUD operations that interact with changed fields
3. Test data migration scenarios locally first
4. Update API documentation and client examples

### Code Review Checklist

- [ ] Follows established handler and response patterns
- [ ] Includes proper input validation for required fields
- [ ] Has consistent error handling with meaningful HTTP status codes
- [ ] Uses proper AWS SDK v3 patterns with modern async/await
- [ ] Includes proper CORS headers on all responses
- [ ] Maintains simplicity and avoids over-engineering
- [ ] Updates relevant tests (local and integration)
- [ ] Documents any API changes in README.md

## Common Anti-Patterns to Avoid

❌ **Don't:**

- Add authentication or authorization (this is a public API by design)
- Inspect or validate the payload content (server should treat data as opaque)
- Add complex business logic or domain-specific features
- Use multiple Lambda functions (keep everything in single handler)
- Mix different response formats across endpoints
- Add dependencies beyond essential AWS services
- Log sensitive data or payload contents
- Skip input validation for request structure
- Use hardcoded configuration values
- Implement complex conflict resolution (keep it last-writer-wins)
- Bundle aws-sdk in deployment package (use external to reduce size)
- Include unnecessary files in deployment (use package patterns)

✅ **Do:**

- Keep server-side code focused on simple key-value storage
- Validate request structure without inspecting payload content
- Use consistent response formats with proper HTTP status codes
- Implement proper error handling with meaningful messages
- Follow AWS best practices for Lambda and DynamoDB
- Use environment variables for configuration
- Log errors without exposing sensitive information
- Implement proper CORS configuration for web clients
- Use modern AWS SDK v3 patterns and TypeScript
- Test both success and error scenarios locally and in integration
- Optimize build process for minimal deployment package size
- Use minification and external dependencies for Lambda efficiency

## Deployment Best Practices

### Bundle Size Optimization

Always ensure deployment packages stay under AWS Lambda limits:

- **Bundle Size Target**: Keep under 50MB zipped, 250MB unzipped
- **Minification**: Always use `--minify` flag in esbuild
- **External Dependencies**: Exclude aws-sdk and other runtime-available modules
- **Package Patterns**: Use selective inclusion to avoid unnecessary files

### Common Deployment Issues

1. **Package Too Large Error**:
   ```
   Unzipped size must be smaller than 262144000 bytes
   ```
   **Solution**: Check build configuration, ensure aws-sdk is external, verify package patterns

2. **Handler Not Found Error**:
   ```
   Cannot find module 'src/handler'
   ```
   **Solution**: Update serverless.yml handler path to `dist/handler.handler`

3. **Build Failures**:
   - Ensure TypeScript compiles without errors
   - Check that all imports are properly resolved
   - Verify esbuild target matches Lambda runtime

### Deployment Verification

After each deployment:
1. Run `./test-api.sh <endpoint>` for comprehensive testing
2. Check CloudWatch logs for any runtime errors
3. Verify all CRUD operations work correctly
4. Test error handling scenarios
- Implement proper CORS configuration for web clients
- Use modern AWS SDK v3 patterns and TypeScript
- Test both success and error scenarios locally and in integration

## Testing Patterns

### Local Testing with Mocks

The `test-local.js` file provides comprehensive local testing:

```javascript
// Mock DynamoDB operations for rapid development
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: () => ({
      send: async (command) => {
        // Mock implementation for each command type
        // Simulate DynamoDB behavior locally
      }
    })
  }
}));
```

### Integration Testing

The `test-api.sh` script provides end-to-end API testing:

```bash
# Test all CRUD operations
# Verify error handling
# Check response format consistency
# Validate HTTP status codes
```

### Development Testing Workflow

1. **Local First**: `pnpm run test:local` - Test handler logic with mocks
2. **Build Verification**: `pnpm run build` - Ensure TypeScript compiles
3. **Deploy to Dev**: `./deploy.sh` - Deploy to development environment
4. **Integration Test**: `./test-api.sh <endpoint>` - Test deployed API
5. **Production Deploy**: `./deploy.sh prod` - Deploy to production if tests pass

---

_This service is designed to be simple, maintainable, and cost-effective for lightweight key-value storage needs. Avoid adding complexity unless absolutely necessary._
