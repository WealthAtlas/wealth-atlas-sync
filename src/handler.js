const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// Helper function to create response
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

// Helper function to validate required fields
const validatePayload = (payload, meta) => {
  if (!payload || typeof payload !== 'string') {
    throw new Error('payload is required and must be a string');
  }
  if (!meta || typeof meta !== 'object') {
    throw new Error('meta is required and must be an object');
  }
  
  // Validate crypto meta structure
  const { enc, kdf, iterations, salt, iv, schemaVersion } = meta;
  if (enc !== 'AES-GCM') {
    throw new Error('meta.enc must be "AES-GCM"');
  }
  if (kdf !== 'PBKDF2-SHA256') {
    throw new Error('meta.kdf must be "PBKDF2-SHA256"');
  }
  if (!iterations || typeof iterations !== 'number' || iterations < 100000) {
    throw new Error('meta.iterations must be a number >= 100000');
  }
  if (!salt || typeof salt !== 'string') {
    throw new Error('meta.salt is required and must be a base64 string');
  }
  if (!iv || typeof iv !== 'string') {
    throw new Error('meta.iv is required and must be a base64 string');
  }
  if (!schemaVersion || typeof schemaVersion !== 'number') {
    throw new Error('meta.schemaVersion is required and must be a number');
  }
};

// CREATE: POST /data
const createDataset = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { payload, meta } = body;

    // Validate input
    validatePayload(payload, meta);

    // Generate new keyId and initial version
    const keyId = uuidv4();
    const version = 1;
    const updatedAt = new Date().toISOString();

    // Store in DynamoDB
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        keyId,
        version,
        payload,
        meta,
        updatedAt,
      },
      ConditionExpression: 'attribute_not_exists(keyId)', // Ensure uniqueness
    });

    await docClient.send(command);

    return createResponse(201, {
      keyId,
      version,
      updatedAt,
    });
  } catch (error) {
    console.error('Error creating dataset:', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return createResponse(409, { error: 'Dataset already exists' });
    }
    
    return createResponse(400, { 
      error: error.message || 'Failed to create dataset' 
    });
  }
};

// READ: GET /data/{keyId}
const getDataset = async (event) => {
  try {
    const { keyId } = event.pathParameters;

    if (!keyId) {
      return createResponse(400, { error: 'keyId is required' });
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { keyId },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return createResponse(404, { error: 'Dataset not found' });
    }

    return createResponse(200, {
      keyId: result.Item.keyId,
      version: result.Item.version,
      payload: result.Item.payload,
      meta: result.Item.meta,
      updatedAt: result.Item.updatedAt,
    });
  } catch (error) {
    console.error('Error retrieving dataset:', error);
    return createResponse(500, { 
      error: 'Failed to retrieve dataset' 
    });
  }
};

// UPDATE: PUT /data/{keyId}
const updateDataset = async (event) => {
  try {
    const { keyId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { payload, meta } = body;

    if (!keyId) {
      return createResponse(400, { error: 'keyId is required' });
    }

    // Validate input
    validatePayload(payload, meta);

    const updatedAt = new Date().toISOString();

    // Increment version and update data
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { keyId },
      UpdateExpression: 'SET #version = #version + :inc, payload = :payload, meta = :meta, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#version': 'version',
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':payload': payload,
        ':meta': meta,
        ':updatedAt': updatedAt,
      },
      ConditionExpression: 'attribute_exists(keyId)', // Ensure dataset exists
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);

    return createResponse(200, {
      keyId: result.Attributes.keyId,
      version: result.Attributes.version,
      updatedAt: result.Attributes.updatedAt,
    });
  } catch (error) {
    console.error('Error updating dataset:', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return createResponse(404, { error: 'Dataset not found' });
    }
    
    return createResponse(400, { 
      error: error.message || 'Failed to update dataset' 
    });
  }
};

// DELETE: DELETE /data/{keyId}
const deleteDataset = async (event) => {
  try {
    const { keyId } = event.pathParameters;

    if (!keyId) {
      return createResponse(400, { error: 'keyId is required' });
    }

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { keyId },
      ConditionExpression: 'attribute_exists(keyId)', // Ensure dataset exists
    });

    await docClient.send(command);

    return createResponse(200, {
      message: 'Dataset deleted successfully',
      keyId,
    });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return createResponse(404, { error: 'Dataset not found' });
    }
    
    return createResponse(500, { 
      error: 'Failed to delete dataset' 
    });
  }
};

// Main Lambda handler
exports.main = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, pathParameters } = event;

    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Route to appropriate handler
    switch (httpMethod) {
      case 'POST':
        return await createDataset(event);
      case 'GET':
        return await getDataset(event);
      case 'PUT':
        return await updateDataset(event);
      case 'DELETE':
        return await deleteDataset(event);
      default:
        return createResponse(405, { 
          error: `Method ${httpMethod} not allowed` 
        });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createResponse(500, { 
      error: 'Internal server error' 
    });
  }
};
