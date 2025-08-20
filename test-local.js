// Mock DynamoDB for local testing
const mockDatabase = new Map();

// Mock AWS SDK
const mockDynamoDBClient = {
  send: async (command) => {
    const commandName = command.constructor.name;
    
    switch (commandName) {
      case 'PutCommand':
        const putKey = command.input.Item.keyId;
        if (mockDatabase.has(putKey)) {
          const error = new Error('The conditional request failed');
          error.name = 'ConditionalCheckFailedException';
          throw error;
        }
        mockDatabase.set(putKey, { ...command.input.Item });
        return {};
        
      case 'GetCommand':
        const getKey = command.input.Key.keyId;
        const item = mockDatabase.get(getKey);
        return item ? { Item: item } : {};
        
      case 'UpdateCommand':
        const updateKey = command.input.Key.keyId;
        const existing = mockDatabase.get(updateKey);
        if (!existing) {
          const error = new Error('The conditional request failed');
          error.name = 'ConditionalCheckFailedException';
          throw error;
        }
        const updated = {
          ...existing,
          version: existing.version + 1,
          payload: command.input.ExpressionAttributeValues[':payload'],
          meta: command.input.ExpressionAttributeValues[':meta'],
          updatedAt: command.input.ExpressionAttributeValues[':updatedAt']
        };
        mockDatabase.set(updateKey, updated);
        return { Attributes: updated };
        
      case 'DeleteCommand':
        const deleteKey = command.input.Key.keyId;
        if (!mockDatabase.has(deleteKey)) {
          const error = new Error('The conditional request failed');
          error.name = 'ConditionalCheckFailedException';
          throw error;
        }
        mockDatabase.delete(deleteKey);
        return {};
        
      default:
        throw new Error(`Unsupported command: ${commandName}`);
    }
  }
};

// Override require for AWS SDK
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@aws-sdk/client-dynamodb') {
    return { DynamoDBClient: function() { return {}; } };
  }
  if (id === '@aws-sdk/lib-dynamodb') {
    return {
      DynamoDBDocumentClient: {
        from: () => mockDynamoDBClient
      },
      GetCommand: class GetCommand {
        constructor(input) { this.input = input; }
      },
      PutCommand: class PutCommand {
        constructor(input) { this.input = input; }
      },
      UpdateCommand: class UpdateCommand {
        constructor(input) { this.input = input; }
      },
      DeleteCommand: class DeleteCommand {
        constructor(input) { this.input = input; }
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

const { main } = require('./src/handler');

// Simple test runner
async function runTests() {
  // Set mock environment
  process.env.TABLE_NAME = 'test-table';
  process.env.REGION = 'us-east-1';
  
  console.log('🧪 Running local handler tests...\n');

  try {
    // Test 1: Create dataset
    console.log('1. Testing POST /data (Create)');
    const createEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        payload: '{"test":"encrypted_data"}',
        meta: {
          enc: 'AES-GCM',
          kdf: 'PBKDF2-SHA256',
          iterations: 250000,
          salt: 'dGVzdF9zYWx0',
          iv: 'dGVzdF9pdg==',
          schemaVersion: 7
        }
      })
    };

    const createResponse = await main(createEvent);
    console.log('Status:', createResponse.statusCode);
    const createBody = JSON.parse(createResponse.body);
    console.log('Response:', createBody);
    
    if (createResponse.statusCode !== 201) {
      throw new Error('Create test failed');
    }

    const keyId = createBody.keyId;
    console.log('✅ Create test passed\n');

    // Test 2: Get dataset
    console.log('2. Testing GET /data/{keyId} (Read)');
    const getEvent = {
      httpMethod: 'GET',
      pathParameters: { keyId }
    };

    const getResponse = await main(getEvent);
    console.log('Status:', getResponse.statusCode);
    console.log('Response:', JSON.parse(getResponse.body));
    
    if (getResponse.statusCode !== 200) {
      throw new Error('Get test failed');
    }
    console.log('✅ Get test passed\n');

    // Test 3: Update dataset
    console.log('3. Testing PUT /data/{keyId} (Update)');
    const updateEvent = {
      httpMethod: 'PUT',
      pathParameters: { keyId },
      body: JSON.stringify({
        payload: '{"test":"updated_encrypted_data"}',
        meta: {
          enc: 'AES-GCM',
          kdf: 'PBKDF2-SHA256',
          iterations: 250000,
          salt: 'dGVzdF9zYWx0',
          iv: 'dGVzdF9pdg==',
          schemaVersion: 7
        }
      })
    };

    const updateResponse = await main(updateEvent);
    console.log('Status:', updateResponse.statusCode);
    console.log('Response:', JSON.parse(updateResponse.body));
    
    if (updateResponse.statusCode !== 200) {
      throw new Error('Update test failed');
    }
    console.log('✅ Update test passed\n');

    // Test 4: Delete dataset
    console.log('4. Testing DELETE /data/{keyId} (Delete)');
    const deleteEvent = {
      httpMethod: 'DELETE',
      pathParameters: { keyId }
    };

    const deleteResponse = await main(deleteEvent);
    console.log('Status:', deleteResponse.statusCode);
    console.log('Response:', JSON.parse(deleteResponse.body));
    
    if (deleteResponse.statusCode !== 200) {
      throw new Error('Delete test failed');
    }
    console.log('✅ Delete test passed\n');

    // Test 5: Error cases
    console.log('5. Testing error cases');
    
    // Invalid method
    const invalidMethodEvent = {
      httpMethod: 'PATCH',
      pathParameters: { keyId: 'test' }
    };
    
    const invalidResponse = await main(invalidMethodEvent);
    console.log('Invalid method status:', invalidResponse.statusCode);
    
    if (invalidResponse.statusCode !== 405) {
      throw new Error('Invalid method test failed');
    }

    // Missing keyId for GET
    const missingKeyEvent = {
      httpMethod: 'GET',
      pathParameters: {}
    };
    
    const missingKeyResponse = await main(missingKeyEvent);
    console.log('Missing key status:', missingKeyResponse.statusCode);
    
    if (missingKeyResponse.statusCode !== 400) {
      throw new Error('Missing key test failed');
    }

    console.log('✅ Error tests passed\n');

    console.log('🎉 All tests passed! Handler is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
