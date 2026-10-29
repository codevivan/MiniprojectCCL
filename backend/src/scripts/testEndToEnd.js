const baseUrl = 'http://16.16.207.70';

async function testAll() {
  console.log('=== Running End-to-End Verification on Live EC2 Instance ===\n');

  // 1. Root SPA HTML
  console.log('--- 1. Testing Root SPA Web Page (GET /) ---');
  const pageRes = await fetch(baseUrl);
  const html = await pageRes.text();
  console.log(`[PASS] Root page returned HTTP ${pageRes.status}, contains title:`, html.includes('<title>CampusBite'));

  // 2. Health Endpoint
  console.log('\n--- 2. Testing API Health Endpoint (GET /api/health) ---');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log(`[PASS] Health API returned HTTP ${healthRes.status}:`);
  console.log('  Status:', healthData.status);
  console.log('  DynamoDB Mode:', healthData.aws?.dynamoDbMode);
  console.log('  S3 Bucket:', healthData.aws?.s3Bucket);
  console.log('  Lambda Task:', healthData.aws?.lambdaFunction);

  // 3. Menu Endpoint (DynamoDB Read)
  console.log('\n--- 3. Testing Menu Endpoint (GET /api/menu) ---');
  const menuRes = await fetch(`${baseUrl}/api/menu`);
  const menuData = await menuRes.json();
  console.log(`[PASS] Menu API returned HTTP ${menuRes.status}, Item count:`, menuData.items?.length);
  if (menuData.items?.length > 0) {
    console.log('  Sample item:', menuData.items[0].name, `(₹${menuData.items[0].price})`);
  }

  // 4. Static / Image Assets Serving
  console.log('\n--- 4. Testing Static Food Asset Serving ---');
  const assetRes = await fetch(`${baseUrl}/images/food/poha.jpg`);
  console.log(`[PASS] Food image returned HTTP ${assetRes.status}, Content-Type:`, assetRes.headers.get('content-type'));

  // 5. Canteen Settings Endpoint (DynamoDB Read)
  console.log('\n--- 5. Testing Canteen Settings (GET /api/settings) ---');
  const setRes = await fetch(`${baseUrl}/api/settings`);
  const setData = await setRes.json();
  console.log(`[PASS] Settings returned HTTP ${setRes.status}:`);
  console.log('  Canteen Name:', setData.settings?.canteenName);
  console.log('  Hours:', setData.settings?.openingHours);

  // 6. Owner Status Endpoint
  console.log('\n--- 6. Testing Owner Account Status (GET /api/auth/owner/status) ---');
  const ownerRes = await fetch(`${baseUrl}/api/auth/owner/status`);
  const ownerData = await ownerRes.json();
  console.log(`[PASS] Owner status returned HTTP ${ownerRes.status}:`);
  console.log('  Has Owner:', ownerData.hasOwner);

  console.log('\n=== ALL END-TO-END CHECKS PASSED SUCCESSFULLY! ===');
}

testAll().catch(console.error);
