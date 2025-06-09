const axios = require('axios');

async function testOAuthFlow() {
  console.log('🔍 Testing OAuth Flow...\n');
  
  try {
    // 1. Test Google OAuth URL generation
    console.log('1. Testing Google OAuth URL generation...');
    const response = await axios.get('https://bian-cu-backend.onrender.com/api/v1/auth/google', {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Location:', response.headers.location);
    
    // Extract Google OAuth URL
    const googleUrl = response.headers.location;
    const urlParams = new URL(googleUrl);
    
    console.log('\n📋 OAuth Parameters:');
    console.log('- Client ID:', urlParams.searchParams.get('client_id'));
    console.log('- Redirect URI:', urlParams.searchParams.get('redirect_uri'));
    console.log('- Scope:', urlParams.searchParams.get('scope'));
    console.log('- Response Type:', urlParams.searchParams.get('response_type'));
    
    // 2. Test if callback URL is accessible
    console.log('\n2. Testing callback URL accessibility...');
    try {
      const callbackTest = await axios.get('https://bian-cu-backend.onrender.com/api/v1/auth/google/callback', {
        validateStatus: () => true
      });
      console.log('✅ Callback URL Status:', callbackTest.status);
      console.log('✅ Callback accessible');
    } catch (error) {
      console.log('❌ Callback URL Error:', error.message);
    }
    
    // 3. Test health endpoint
    console.log('\n3. Testing health endpoint...');
    try {
      const healthTest = await axios.get('https://bian-cu-backend.onrender.com/api/health', {
        validateStatus: () => true
      });
      console.log('✅ Health Status:', healthTest.status);
      if (healthTest.data) {
        console.log('✅ Health Data:', healthTest.data);
      }
    } catch (error) {
      console.log('❌ Health Error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('❌ Status:', error.response.status);
      console.log('❌ Data:', error.response.data);
    }
  }
}

testOAuthFlow(); 