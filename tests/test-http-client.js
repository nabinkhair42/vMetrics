// Test HTTP client connectivity
const https = require('https');
const http = require('http');

async function testHttpConnection() {
  console.log('🧪 Testing HTTP Client Connectivity');
  console.log('=====================================');
  
  // Test server health endpoint
  try {
    const healthResponse = await makeRequest('GET', 'http://localhost:3001/health');
    console.log('✅ Server health check:', healthResponse ? 'OK' : 'Failed');
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return;
  }
  
  // Test API endpoint with mock token
  try {
    const mockToken = 'test-token';
    const apiResponse = await makeRequest('GET', 'http://localhost:3001/api/activity/stats', {
      'Authorization': `Bearer ${mockToken}`
    });
    
    // We expect this to fail with 401 (unauthorized) which is normal
    console.log('📊 API endpoint test: Expected 401 (unauthorized) for mock token');
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ API endpoint responding correctly (401 unauthorized for invalid token)');
    } else {
      console.log('❌ API endpoint error:', error.message);
    }
  }
  
  console.log('\n🎯 HTTP Client is ready for the extension!');
}

function makeRequest(method, url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestModule = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };

    const req = requestModule.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

testHttpConnection().catch(console.error);
