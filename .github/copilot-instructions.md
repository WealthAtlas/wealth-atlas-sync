# GitHub Copilot Instructions for Wealth Atlas Sync Service

## Project Overview

**Wealth Atlas Sync** is a serverless backend API for encrypted data synchronization in the Wealth Atlas ecosystem. It provides secure, encrypted storage for client-side applications using AWS Lambda and DynamoDB with a maintenance-first approach.

### Core Technology Stack

- **AWS Lambda** - Serverless compute platform for API handlers
- **DynamoDB** - NoSQL database for encrypted blob storage
- **API Gateway** - RESTful API with CORS support
- **Serverless Framework** - Infrastructure as Code deployment
- **Node.js 18+** - JavaScript runtime
- **AWS SDK v3** - Modern AWS service clients

### Package Manager

- **pnpm** - Preferred package manager (specified in `package.json` as `packageManager: "pnpm@9.0.0"`)

## Core Development Principles

### 1. Simplicity & Maintenance-First Design

- **Maintenance Over Features** - Prioritize long-term maintainability over complex features
- **Single Purpose** - Each Lambda function has one clear responsibility
- **Minimal Dependencies** - Keep external dependencies to essential AWS services only
- **Clear Error Handling** - Explicit error responses with proper HTTP status codes

### 2. Security & Encryption

- **Client-Side Encryption** - Server only stores opaque encrypted blobs
- **No Server-Side Decryption** - Never decrypt or validate client data on server
- **Secure Headers** - Proper CORS and security headers on all responses
- **Input Validation** - Validate request structure without inspecting encrypted content

### 3. AWS Best Practices

- **Serverless Design** - Stateless functions with proper resource management
- **DynamoDB Optimization** - Efficient key design and minimal table operations
- **Error Handling** - Proper AWS SDK error handling with retry logic
- **Resource Cleanup** - Proper client disposal and connection management

### 4. API Design Principles

- **RESTful Conventions** - Standard HTTP methods and status codes
- **Consistent Responses** - Uniform JSON response structure across all endpoints
- **CORS Support** - Proper CORS headers for web client integration
- **Version Management** - Server-side version tracking for conflict resolution

- **Domain Logic** - All business rules, calculations, and domain operations in `src/domain/`
## Architecture Principles

### Serverless Lambda Architecture

The sync service follows a simple serverless architecture optimized for maintenance:

```
src/
└── handler.js        # Single Lambda handler with all API endpoints
serverless.yml        # Infrastructure as Code configuration
deploy.sh             # Deployment automation script
test-api.sh           # API testing script
test-local.js         # Local testing script
```

### Key Architectural Rules

1. **Single Handler Pattern** (`src/handler.js`)
   - All API endpoints in one file for simplicity
   - Clear function separation for each HTTP method
   - Shared utilities for common operations
   - Consistent error handling across all endpoints

2. **DynamoDB Design**
   - Single table design with `keyId` as partition key
   - Server-side versioning for conflict resolution
   - Automatic timestamp management
   - Minimal indexes for cost optimization

3. **Serverless Configuration** (`serverless.yml`)
   - Environment-specific deployments
   - Proper IAM roles and permissions
   - CORS configuration for web clients
   - Resource naming conventions

### API Contract (Last-Writer-Wins)

The service implements a simple last-writer-wins synchronization model:

- `POST /data` → Create new encrypted dataset, returns `{ keyId, version: 1 }`
- `GET /data/{keyId}` → Retrieve latest `{ keyId, version, payload, meta, updatedAt }`
- `PUT /data/{keyId}` → Update dataset, server increments version automatically
- `DELETE /data/{keyId}` → Remove dataset (optional endpoint)

### Encryption Model

- **Client-Side Only** - All encryption/decryption happens on the client
- **Opaque Blobs** - Server stores encrypted payload without understanding content
- **Crypto Metadata** - Non-secret metadata stored alongside encrypted payload
- **No Server-Side Keys** - Server never has access to decryption keys

## Code Quality Standards

- Uses **Node.js 18+** with modern JavaScript features
- **Clean Code Practices** - Clear function names, minimal complexity, self-documenting code
- **Error Handling** - Comprehensive error handling with proper HTTP status codes
- **Security Best Practices** - Input validation, secure headers, no sensitive data logging

### Testing Strategy

- **Unit Tests** - Focus on business logic and validation functions
- **Integration Tests** - Test DynamoDB operations and API endpoints
- **Local Testing** - Use `test-local.js` for rapid development feedback
- **API Testing** - Use `test-api.sh` for comprehensive endpoint testing

## Development Patterns

### Handler Function Pattern

The main handler follows a clear pattern for each endpoint:

```javascript
// Route handling with clear separation
if (event.httpMethod === 'POST' && event.resource === '/data') {
  return await createData(event);
}

// Individual handler functions
const createData = async (event) => {
  try {
    // 1. Parse and validate input
    const { payload, meta } = JSON.parse(event.body);
    validatePayload(payload, meta);
    
    // 2. Business logic
    const keyId = uuidv4();
    const version = 1;
    
    // 3. Database operation
    await docClient.send(new PutCommand({ /* ... */ }));
    
    // 4. Consistent response
    return createResponse(201, { keyId, version, updatedAt });
  } catch (error) {
    return handleError(error);
  }
};
```

### Error Handling Pattern

Consistent error handling across all endpoints:

```javascript
const handleError = (error) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationException') {
    return createResponse(400, { error: 'Invalid request data' });
  }
  
  if (error.name === 'ConditionalCheckFailedException') {
    return createResponse(409, { error: 'Version conflict' });
  }
  
  return createResponse(500, { error: 'Internal server error' });
};
```

### DynamoDB Operation Pattern

Standardized database operations with proper error handling:

```javascript
const params = {
  TableName: TABLE_NAME,
  Key: { keyId },
  // Include proper conditions for optimistic locking
  ConditionExpression: 'version = :expectedVersion',
  ExpressionAttributeValues: { ':expectedVersion': expectedVersion }
};

try {
  const result = await docClient.send(new UpdateCommand(params));
  return result;
} catch (error) {
  if (error.name === 'ConditionalCheckFailedException') {
    throw new Error('Version conflict - data was modified by another client');
  }
  throw error;
}
```
}

// Domain class implementing the interface
export class Asset implements IAsset {
  constructor(/* all fields */) {
    this.validateName();
  }

  private validateName(): void {
    /* validation logic */
  }
  getTotalInvestedAmount(transactions: AssetTransaction[]): number {
    /* business logic */
  }
  getCurrentHoldings(transactions: AssetTransaction[]): number {
    /* business logic */
  }
  getProfitLoss(transactions: AssetTransaction[]): number | undefined {
    /* business logic */
  }
}
````

### Wealth Management Domain Patterns

#### Asset & Transaction Model

- **Assets** represent investable items (stocks, real estate, mutual funds, FDs, gold, etc.)
- **Transactions** track buy/sell activities with quantity (optional) and unit price
- **No Computed Storage** - Calculate portfolio metrics at runtime
- **Money-First Approach** - Always prioritize monetary tracking over quantity

#### SIP (Systematic Investment Plan) Model

- **Scheduled Asset Transactions** represent recurring investment plans for assets
- **Auto-Conversion Pattern** - Follows loan payment pattern for converting scheduled to actual transactions
- **Investment Frequency** - Support for monthly, quarterly, semi-annual, and annual investments
- **Progress Tracking** - Monitor total invested vs expected investment amounts
- **SIP Lifecycle Management** - Create, edit, pause/resume, and delete SIPs with transaction preservation options
- **Application Startup Auto-Conversion** - Automatically processes due SIPs when application opens

#### Expense Tracking Model

- **Expenses** represent personal expenditures with categorization and analytics
- **Monthly Grouping** - Expenses are organized by month with expandable sections
- **Multi-Currency Support** - Expenses support different currencies using Currency enum
- **Category Classification** - Expenses are categorized (FOOD, TRANSPORT, HOUSING, etc.)
- **Essential vs Non-Essential** - Track whether expenses are essential or discretionary
- **Scheduled Expenses** - Recurring expenses that auto-generate actual expense records

#### Scheduled Expense Model

- **Scheduled Expenses** represent recurring expense patterns for auto-generation of actual expenses
- **Auto-Generation Pattern** - Follows loan payment pattern for converting scheduled to actual expenses
- **Expense Frequency** - Support for daily, weekly, monthly, quarterly, semi-annual, and annual expenses
- **Application Startup Auto-Conversion** - Automatically processes due scheduled expenses when application opens
- **Optional End Date** - Scheduled expenses can run indefinitely or until a specified end date
## Development Workflow

### Scripts Usage

- `pnpm deploy` - Deploy to AWS (uses default stage)
- `pnpm run deploy:prod` - Deploy to production environment
- `pnpm remove` - Remove serverless stack from AWS
- `pnpm logs` - View Lambda function logs
- `pnpm test` - Run unit tests with Jest
- `pnpm run test:local` - Test handler locally with mock data
- `pnpm run test:api` - Test deployed API endpoints
- `pnpm local` - Run serverless offline for local development

### Local Development

- Use `test-local.js` for rapid local testing without deployment
- Use `serverless offline` for full local API Gateway simulation
- Test API endpoints with `test-api.sh` after deployment

### Deployment Process

1. **Development** - Test locally with `test-local.js`
2. **Integration** - Deploy to dev stage and test with `test-api.sh`
3. **Production** - Deploy to prod with `./deploy.sh prod`

## Security Considerations

### Encryption Model

- **Client-Side Only** - All encryption/decryption happens on the client
- **Opaque Storage** - Server never sees or processes unencrypted data
- **Metadata Only** - Server stores non-secret encryption metadata (algorithm, iterations, salt, IV)
- **No Key Storage** - Server never has access to encryption keys or passphrases

### Data Validation

- **Structure Only** - Validate request structure without inspecting encrypted content
- **Crypto Metadata** - Validate encryption metadata format and values
- **Size Limits** - Implement reasonable payload size limits
- **Input Sanitization** - Sanitize all inputs before processing

### CORS Configuration

- Proper CORS headers for web client integration
- Allow necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Secure header configuration for production use

## Sync Service Patterns

### Last-Writer-Wins Conflict Resolution

The service implements a simple conflict resolution strategy:

1. **Server-Side Versioning** - Server automatically increments version on each update
2. **No Client Conflicts** - Client always accepts server version as authoritative
3. **Simple Overwrite** - Last write wins, no merge logic needed
4. **Version Tracking** - Version numbers help clients detect changes

### Payload Structure

**Encrypted Payload** (client-side encrypted JSON):
```json
{
  "schemaVersion": 7,
  "data": {
    "assets": [...],
    "transactions": [...],
    "expenses": [...],
    // ... other app data
  }
}
```

**Crypto Metadata** (stored alongside payload, non-secret):
```json
{
  "enc": "AES-GCM",
  "kdf": "PBKDF2-SHA256",
  "iterations": 250000,
  "salt": "base64_encoded_salt",
  "iv": "base64_encoded_iv",
  "schemaVersion": 7
}
```
3. **Edit with History** - When editing SIPs, automatically create actual transactions for past due dates
4. **Pause/Resume Capability** - Toggle SIP active status without losing configuration or transaction history
5. **Flexible Deletion** - Option to keep or remove existing transactions when deleting SIPs
6. **Progress Analytics** - Track total invested vs expected investment amounts with completion status
7. **Investment Frequency Support** - Monthly, quarterly, semi-annual, and annual scheduling options

#### Goal Management Model

- **Goals** represent financial objectives with target amounts, maturity dates, and inflation adjustments
- **Asset-Goal Allocations** track percentage-based allocation of assets to specific goals
- **Progress Tracking** - Real-time calculation of goal achievement probability using asset IRR
- **Multi-Asset Support** - Single goals can have allocations from multiple assets
- **Currency Independence** - Goals have independent currency settings with future conversion support

#### Goal Management Rules

## AI Coding Guidelines

### When Adding New Features

1. **Start Simple** - Add new endpoints following the established handler pattern
2. **Validate Input** - Always validate request structure and required fields
3. **Handle Errors** - Use consistent error handling patterns across endpoints
4. **Test Locally** - Use `test-local.js` for rapid development iteration
5. **Test Integration** - Deploy and test with `test-api.sh` before production

### When Modifying Existing Code

1. **Preserve Patterns** - Maintain established coding patterns and structure
2. **Update Tests** - Ensure both local and API tests pass after changes
3. **Backward Compatibility** - Consider existing client applications when changing APIs
4. **Security First** - Never compromise on encryption or security principles

### Common Development Tasks

#### Adding a New API Endpoint

1. Add route handling in main handler function
2. Create dedicated handler function following the pattern
3. Implement proper input validation
4. Add DynamoDB operations with error handling
5. Return consistent response format
6. Update `test-api.sh` with new endpoint tests

#### Modifying DynamoDB Schema

1. Consider backward compatibility with existing data
2. Update validation functions if needed
3. Test data migration scenarios locally
4. Update API documentation and tests

### Code Review Checklist

- [ ] Follows established handler patterns
- [ ] Includes proper input validation
- [ ] Has consistent error handling
- [ ] Uses proper AWS SDK v3 patterns
- [ ] Includes CORS headers on all responses
- [ ] Maintains security best practices
- [ ] Updates relevant tests
- [ ] Documents any breaking changes

## Common Anti-Patterns to Avoid

❌ **Don't:**

- Decrypt or inspect encrypted payload on server
- Store encryption keys or passphrases
- Mix business logic with AWS Lambda boilerplate
- Use hardcoded configuration values
- Skip input validation for "internal" endpoints
- Return different response formats across endpoints
- Log sensitive data or encrypted payloads
- Use outdated AWS SDK patterns
- Skip error handling for DynamoDB operations
- Allow unrestricted CORS origins in production

✅ **Do:**

- Keep server-side code focused on storage and versioning
- Validate request structure without inspecting content
- Use consistent response formats across all endpoints
- Implement proper error handling with meaningful status codes
- Follow AWS best practices for Lambda and DynamoDB
- Use environment variables for configuration
- Log errors without exposing sensitive information
- Implement proper CORS configuration
- Use modern AWS SDK v3 patterns
- Test both success and error scenarios

---

_This document should be updated as the service evolves and new patterns emerge._
