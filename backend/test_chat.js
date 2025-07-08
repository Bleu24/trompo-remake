const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODZkMjY3YjdhNjBjMDJlMWFiNTVlYWIiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDA4MjA1Mjl9.mKtD_YqUV_YyIMU2G0LPeYK-fXUcIl1lmQR_jTe_Aeo';

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function testChatEndpoints() {
  console.log('Testing Chat API Endpoints...\n');

  try {
    // Test user search
    console.log('1. Testing user search...');
    const searchResponse = await axios.get(`${BASE_URL}/chat/users/search?q=test`, { headers });
    console.log('User search result:', searchResponse.data);

    // Test get conversations
    console.log('\n2. Testing get conversations...');
    const conversationsResponse = await axios.get(`${BASE_URL}/chat/conversations`, { headers });
    console.log('Conversations result:', conversationsResponse.data);

    console.log('\n✅ All endpoints are working!');
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
  }
}

testChatEndpoints();
