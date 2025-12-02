const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({
  baseURL: 'http://localhost:4000',
  jar,
  withCredentials: true
}));

async function testEndpoints() {
  console.log('🔍 Testing Admin Endpoints...\n');

  try {
    // 1. Login
    console.log('1. Attempting Login...');
    const loginRes = await client.post('/admin/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    console.log('✅ Login Successful:', loginRes.status);

    // 2. Test Dashboard Stats
    console.log('\n2. Testing /admin/dashboard/stats...');
    try {
      const statsRes = await client.get('/admin/dashboard/stats');
      console.log('✅ Dashboard Stats Found:', statsRes.status);
      console.log('   Data:', statsRes.data);
    } catch (error) {
      console.log('❌ Dashboard Stats Failed:', error.response?.status || error.message);
      if (error.response?.status === 404) {
        console.log('   ⚠️  Server returned 404. This usually means the server needs a restart to pick up new routes.');
      }
    }

    // 3. Test Users Data
    console.log('\n3. Testing /admin/users/data...');
    try {
      const usersRes = await client.get('/admin/users/data');
      console.log('✅ Users Data Found:', usersRes.status);
      console.log('   Count:', usersRes.data.length);
    } catch (error) {
      console.log('❌ Users Data Failed:', error.response?.status || error.message);
    }

  } catch (error) {
    console.error('❌ Critical Error (Login Failed?):', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testEndpoints();
