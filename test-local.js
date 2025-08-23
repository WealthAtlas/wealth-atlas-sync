const { handler } = require('./dist/handler');

// Mock environment
process.env.TABLE_NAME = 'test-table';

// Test data
const testPayload = {
  payload: "encrypted_data_here",
  meta: {
    enc: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: 250000,
    salt: "base64_string",
    iv: "base64_string",
    schemaVersion: 7
  }
};

async function runTests() {
  console.log('🧪 Running local tests...\n');

  // Test POST /data
  console.log('1. Testing POST /data (create dataset)');
  const createEvent = {
    httpMethod: 'POST',
    resource: '/data',
    body: JSON.stringify(testPayload),
    pathParameters: null
  };

  try {
    const createResult = await handler(createEvent);
    console.log('✅ Create Response:', JSON.parse(createResult.body));
    
    const created = JSON.parse(createResult.body);
    const keyId = created.keyId;

    // Test GET /data/{keyId}
    console.log('\n2. Testing GET /data/{keyId} (retrieve dataset)');
    const getEvent = {
      httpMethod: 'GET',
      resource: '/data/{keyId}',
      pathParameters: { keyId },
      body: null
    };

    const getResult = await handler(getEvent);
    console.log('✅ Get Response:', JSON.parse(getResult.body));

    // Test PUT /data/{keyId}
    console.log('\n3. Testing PUT /data/{keyId} (update dataset)');
    const updatePayload = {
      payload: "updated_encrypted_data",
      meta: { ...testPayload.meta, schemaVersion: 8 }
    };

    const putEvent = {
      httpMethod: 'PUT',
      resource: '/data/{keyId}',
      pathParameters: { keyId },
      body: JSON.stringify(updatePayload)
    };

    const putResult = await handler(putEvent);
    console.log('✅ Update Response:', JSON.parse(putResult.body));

    // Test DELETE /data/{keyId}
    console.log('\n4. Testing DELETE /data/{keyId} (delete dataset)');
    const deleteEvent = {
      httpMethod: 'DELETE',
      resource: '/data/{keyId}',
      pathParameters: { keyId },
      body: null
    };

    const deleteResult = await handler(deleteEvent);
    console.log('✅ Delete Response:', JSON.parse(deleteResult.body));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n✨ Local tests completed!');
}

// Mock DynamoDB operations for local testing
const originalDocClient = require('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient;
const mockData = new Map();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/lib-dynamodb'),
  DynamoDBDocumentClient: {
    from: () => ({
      send: async (command) => {
        const commandName = command.constructor.name;
        
        if (commandName === 'PutCommand') {
          const item = command.input.Item;
          if (command.input.ConditionExpression && mockData.has(item.keyId)) {
            const error = new Error('ConditionalCheckFailedException');
            error.name = 'ConditionalCheckFailedException';
            throw error;
          }
          mockData.set(item.keyId, item);
          return { Attributes: item };
        }
        
        if (commandName === 'GetCommand') {
          const keyId = command.input.Key.keyId;
          const item = mockData.get(keyId);
          return { Item: item };
        }
        
        if (commandName === 'UpdateCommand') {
          const keyId = command.input.Key.keyId;
          const existingItem = mockData.get(keyId);
          if (!existingItem && command.input.ConditionExpression?.includes('attribute_exists')) {
            const error = new Error('ConditionalCheckFailedException');
            error.name = 'ConditionalCheckFailedException';
            throw error;
          }
          
          const updatedItem = {
            ...existingItem,
            version: (existingItem?.version || 0) + 1,
            payload: command.input.ExpressionAttributeValues[':payload'],
            meta: command.input.ExpressionAttributeValues[':meta'],
            updatedAt: command.input.ExpressionAttributeValues[':updatedAt']
          };
          
          mockData.set(keyId, updatedItem);
          return { Attributes: updatedItem };
        }
        
        if (commandName === 'DeleteCommand') {
          const keyId = command.input.Key.keyId;
          if (!mockData.has(keyId) && command.input.ConditionExpression?.includes('attribute_exists')) {
            const error = new Error('ConditionalCheckFailedException');
            error.name = 'ConditionalCheckFailedException';
            throw error;
          }
          mockData.delete(keyId);
          return {};
        }
        
        return {};
      }
    })
  }
}));

if (require.main === module) {
  runTests().catch(console.error);
}
