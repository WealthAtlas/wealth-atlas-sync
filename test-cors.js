const { handler } = require('./dist/handler');

// Mock environment
process.env.TABLE_NAME = 'test-table';

async function testCORS() {
  console.log('🧪 Testing CORS OPTIONS requests...\n');

  // Test OPTIONS for /data (POST endpoint)
  const optionsDataEvent = {
    httpMethod: 'OPTIONS',
    resource: '/data',
    body: null,
    pathParameters: null
  };

  console.log('1. Testing OPTIONS /data (for POST requests)');
  const optionsDataResult = await handler(optionsDataEvent);
  console.log('Status:', optionsDataResult.statusCode);
  console.log('Headers:', JSON.stringify(optionsDataResult.headers, null, 2));
  console.log('Body:', optionsDataResult.body);
  console.log('✅ Should return 200 with CORS headers\n');

  // Test OPTIONS for /data/{keyId} (GET/PUT/DELETE endpoints)
  const optionsKeyIdEvent = {
    httpMethod: 'OPTIONS',
    resource: '/data/{keyId}',
    body: null,
    pathParameters: { keyId: 'test-key' }
  };

  console.log('2. Testing OPTIONS /data/{keyId} (for GET/PUT/DELETE requests)');
  const optionsKeyIdResult = await handler(optionsKeyIdEvent);
  console.log('Status:', optionsKeyIdResult.statusCode);
  console.log('Headers:', JSON.stringify(optionsKeyIdResult.headers, null, 2));
  console.log('Body:', optionsKeyIdResult.body);
  console.log('✅ Should return 200 with CORS headers\n');

  // Verify CORS headers are present
  const requiredCORSHeaders = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers', 
    'Access-Control-Allow-Methods'
  ];

  console.log('3. Verifying CORS headers are present:');
  requiredCORSHeaders.forEach(header => {
    const hasHeader = optionsDataResult.headers[header] && optionsKeyIdResult.headers[header];
    console.log(`   ${header}: ${hasHeader ? '✅' : '❌'}`);
  });

  console.log('\n🎉 CORS test completed!');
}

testCORS().catch(console.error);
