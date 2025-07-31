import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUserData = {
  name: 'Test User',
  height: 175,
  weight: 70,
  bmi: 22.86,
  activityLevel: 'moderately active',
  sleepHours: 7,
  dietPreference: 'vegetarian',
  healthGoal: 'Lose weight and improve fitness',
  stressLevel: 'moderate',
  healthScore: 75
};

// First, let's test login to get a token
async function testLogin() {
  try {
    console.log('Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful, token received');
      return loginResponse.data.token;
    } else {
      console.log('❌ Login failed - no token received');
      return null;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

// Test the user-form POST endpoint
async function testUserFormPost(token) {
  if (!token) {
    console.log('❌ No token available for user-form test');
    return;
  }

  try {
    console.log('Testing user-form POST...');
    const response = await axios.post(`${BASE_URL}/user-form/user-form`, testUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User-form POST successful:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ User-form POST failed:', error.response?.data || error.message);
    return null;
  }
}

// Test the user-form GET endpoint
async function testUserFormGet(token) {
  if (!token) {
    console.log('❌ No token available for user-form GET test');
    return;
  }

  try {
    console.log('Testing user-form GET...');
    const response = await axios.get(`${BASE_URL}/user-form/user-form`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User-form GET successful:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ User-form GET failed:', error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting user-form API tests...\n');
  
  // Test 1: Login
  const token = await testLogin();
  console.log('');
  
  // Test 2: POST user-form
  const postResult = await testUserFormPost(token);
  console.log('');
  
  // Test 3: GET user-form
  const getResult = await testUserFormGet(token);
  console.log('');
  
  console.log('📊 Test Summary:');
  console.log(`Login: ${token ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`POST user-form: ${postResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`GET user-form: ${getResult ? '✅ PASS' : '❌ FAIL'}`);
}

// Run the tests
runTests().catch(console.error); 