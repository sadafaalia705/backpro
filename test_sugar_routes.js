import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Test function to check server is running
async function testServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/`);
    const text = await response.text();
    console.log('✅ Server is running:', text);
    return true;
  } catch (error) {
    console.error('❌ Server is not running:', error.message);
    return false;
  }
}

// Test function to check sugar routes without authentication
async function testSugarRoutes() {
  console.log('\n🔍 Testing sugar routes...');
  
  // Test GET /api/sugar/getsugar without auth
  try {
    const response = await fetch(`${BASE_URL}/api/sugar/getsugar`);
    console.log('GET /api/sugar/getsugar status:', response.status);
    if (response.status === 401) {
      console.log('✅ Route exists but requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing GET route:', error.message);
  }

  // Test POST /api/sugar/addsugar without auth
  try {
    const response = await fetch(`${BASE_URL}/api/sugar/addsugar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        glucose_level: 120,
        notes: 'Test reading'
      })
    });
    console.log('POST /api/sugar/addsugar status:', response.status);
    if (response.status === 401) {
      console.log('✅ Route exists but requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing POST route:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting sugar routes test...\n');
  
  const serverRunning = await testServerHealth();
  if (!serverRunning) {
    console.log('❌ Cannot test routes - server is not running');
    console.log('💡 Please start the server with: npm start');
    return;
  }

  await testSugarRoutes();
  
  console.log('\n✅ Test completed!');
  console.log('\n💡 If routes return 401, they are working correctly but need authentication.');
  console.log('💡 If routes return 404, there might be a routing issue.');
}

runTests().catch(console.error); 