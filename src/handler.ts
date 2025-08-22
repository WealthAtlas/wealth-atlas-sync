import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'wealth-atlas-sync-dev';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// Response helper
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

// CREATE: POST /data
const createData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { payload, meta } = JSON.parse(event.body!);
  const keyId = uuidv4();
  const updatedAt = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { keyId, version: 1, payload, meta, updatedAt },
  }));

  return response(201, { keyId, version: 1, updatedAt });
};

// READ: GET /data/{keyId}
const getData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { keyId } = event.pathParameters!;
  
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { keyId },
  }));

  if (!result.Item) {
    return response(404, { error: 'Not found' });
  }

  return response(200, result.Item);
};

// UPDATE: PUT /data/{keyId}
const updateData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { keyId } = event.pathParameters!;
  const { payload, meta } = JSON.parse(event.body!);
  const updatedAt = new Date().toISOString();

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { keyId },
    UpdateExpression: 'SET version = version + :inc, payload = :payload, meta = :meta, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':inc': 1,
      ':payload': payload,
      ':meta': meta,
      ':updatedAt': updatedAt,
    },
    ReturnValues: 'ALL_NEW',
  }));

  return response(200, result.Attributes);
};

// DELETE: DELETE /data/{keyId}
const deleteData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { keyId } = event.pathParameters!;

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { keyId },
  }));

  return response(200, { message: 'Deleted', keyId });
};

// Main handler
export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return response(200, {});
    }

    switch (event.httpMethod) {
      case 'POST': return await createData(event);
      case 'GET': return await getData(event);
      case 'PUT': return await updateData(event);
      case 'DELETE': return await deleteData(event);
      default: return response(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response(500, { error: 'Internal error' });
  }
};
