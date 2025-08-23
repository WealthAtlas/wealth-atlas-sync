import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import * as crypto from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME!;

  try {
    // OPTIONS /data - Handle preflight requests for POST
    if (event.httpMethod === "OPTIONS" && event.resource === "/data") {
      return response(200, {});
    }

    // OPTIONS /data/{keyId} - Handle preflight requests for GET/PUT/DELETE
    if (event.httpMethod === "OPTIONS" && event.resource === "/data/{keyId}") {
      return response(200, {});
    }

    // POST /data - Create new dataset
    if (event.httpMethod === "POST" && event.resource === "/data") {
      return await createData(event, tableName);
    }

    // GET /data/{keyId} - Retrieve dataset
    if (event.httpMethod === "GET" && event.resource === "/data/{keyId}") {
      return await getData(event, tableName);
    }

    // PUT /data/{keyId} - Update existing dataset
    if (event.httpMethod === "PUT" && event.resource === "/data/{keyId}") {
      return await updateData(event, tableName);
    }

    // DELETE /data/{keyId} - Delete dataset
    if (event.httpMethod === "DELETE" && event.resource === "/data/{keyId}") {
      return await deleteData(event, tableName);
    }

    return response(400, { error: "Unsupported method or path" });
  } catch (err) {
    console.error("Handler error:", err);
    return response(500, { error: "Internal Server Error" });
  }
};

// Create new dataset
async function createData(event: any, tableName: string) {
  try {
    const body = JSON.parse(event.body || "{}");
    
    // Validate required fields
    if (!body.payload) {
      return response(400, { error: "payload is required" });
    }

    const keyId = crypto.randomUUID();
    const version = 1;
    const updatedAt = new Date().toISOString();

    const item = {
      keyId,
      version,
      payload: body.payload,
      meta: body.meta || null,
      updatedAt
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(keyId)"
      })
    );

    return response(201, {
      keyId,
      version,
      updatedAt
    });
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return response(409, { error: "Dataset already exists" });
    }
    throw error;
  }
}

// Get existing dataset
async function getData(event: any, tableName: string) {
  const keyId = event.pathParameters?.keyId;
  
  if (!keyId) {
    return response(400, { error: "keyId is required" });
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { keyId }
    })
  );

  if (!result.Item) {
    return response(404, { error: "Dataset not found" });
  }

  return response(200, {
    keyId: result.Item.keyId,
    version: result.Item.version,
    payload: result.Item.payload,
    meta: result.Item.meta,
    updatedAt: result.Item.updatedAt
  });
}

// Update existing dataset
async function updateData(event: any, tableName: string) {
  const keyId = event.pathParameters?.keyId;
  
  if (!keyId) {
    return response(400, { error: "keyId is required" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    
    if (!body.payload) {
      return response(400, { error: "payload is required" });
    }

    const updatedAt = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
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
      })
    );

    return response(200, {
      keyId: result.Attributes!.keyId,
      version: result.Attributes!.version,
      updatedAt: result.Attributes!.updatedAt
    });
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return response(404, { error: "Dataset not found" });
    }
    throw error;
  }
}

// Delete dataset
async function deleteData(event: any, tableName: string) {
  const keyId = event.pathParameters?.keyId;
  
  if (!keyId) {
    return response(400, { error: "keyId is required" });
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { keyId },
        ConditionExpression: "attribute_exists(keyId)"
      })
    );

    return response(200, {
      message: "Dataset deleted successfully",
      keyId
    });
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return response(404, { error: "Dataset not found" });
    }
    throw error;
  }
}

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(body),
  };
}