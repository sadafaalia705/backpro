import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Test step API endpoints
const testStepAPI = async () => {
  console.log('🧪 Testing Step API...\n');

  // First, get a valid token (you'll need to replace this with a real token)
  const testToken = 'your-test-token-here'; // Replace with actual token

  try {
    // Test 1: Save step data
    console.log('1️⃣ Testing POST /api/step/send');
    const saveResponse = await fetch(`${BASE_URL}/api/step/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        day: 'Monday',
        steps: 8500,
        miles: 4.25,
        minutes: 127,
        calories: 510,
        floors: 3,
      }),
    });

    console.log('Save Response Status:', saveResponse.status);
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('✅ Save successful:', saveData);
    } else {
      console.log('❌ Save failed:', await saveResponse.text());
    }

    // Test 2: Get weekly data
    console.log('\n2️⃣ Testing GET /api/step/get');
    const getResponse = await fetch(`${BASE_URL}/api/step/get`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
      },
    });

    console.log('Get Response Status:', getResponse.status);
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Get successful:', getData);
    } else {
      console.log('❌ Get failed:', await getResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testStepAPI(); 