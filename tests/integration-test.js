#!/usr/bin/env node

/**
 * Comprehensive Integration Test for VSCode Productivity Tracker
 * Tests the full data flow: Extension -> Server -> Database -> Dashboard
 */

const http = require('http');
const WebSocket = require('ws');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ3MGY4ZDU0NDA3ZTZkYjM3MWJhMjciLCJnaXRodWJJZCI6IjEzOTY4NzE2OCIsImVtYWlsIjoibmFiaW5raGFpcjEyQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoibmFiaW5raGFpcjQyIiwiaWF0IjoxNzQ5NDg3NTAxLCJleHAiOjE3NTAwOTIzMDF9.bfMhl-vhBlq6FYaB1tPJmO266ACDLePSlkZsgiRP-G4';

console.log('🚀 Starting Comprehensive Integration Test\n');

// Test Configuration
const config = {
  server: 'http://localhost:3001',
  dashboard: 'http://localhost:3000',
  websocket: 'ws://localhost:3001/ws/activity'
};

// Test Results
const results = {
  serverHealth: false,
  apiAuthentication: false,
  websocketConnection: false,
  activitySaving: false,
  statsRetrieval: false,
  dashboardAccess: false
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test 1: Server Health Check
async function testServerHealth() {
  console.log('1️⃣ Testing Server Health...');
  try {
    const response = await makeRequest(`${config.server}/health`);
    if (response.status === 200) {
      console.log('   ✅ Server is healthy');
      console.log(`   📊 Active connections: ${response.data.connections || 0}`);
      results.serverHealth = true;
    } else {
      console.log('   ❌ Server health check failed');
    }
  } catch (error) {
    console.log('   ❌ Server is not responding');
  }
}

// Test 2: API Authentication
async function testApiAuthentication() {
  console.log('\n2️⃣ Testing API Authentication...');
  try {
    const response = await makeRequest(`${config.server}/api/activity/stats`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('   ✅ API authentication successful');
      console.log('   📈 Current stats:', response.data);
      results.apiAuthentication = true;
    } else {
      console.log('   ❌ API authentication failed');
    }
  } catch (error) {
    console.log('   ❌ API request failed:', error.message);
  }
}

// Test 3: WebSocket Connection and Activity Tracking
async function testWebSocketAndActivity() {
  console.log('\n3️⃣ Testing WebSocket Connection and Activity Tracking...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${config.websocket}?token=${encodeURIComponent(TOKEN)}`);
    let activitySaved = false;
    
    const timeout = setTimeout(() => {
      console.log('   ⏰ WebSocket test timed out');
      ws.close();
      resolve();
    }, 10000);
    
    ws.on('open', () => {
      console.log('   ✅ WebSocket connected successfully');
      results.websocketConnection = true;
      
      // Send a test activity event
      const activityEvent = {
        type: 'file_open',
        timestamp: Date.now(),
        file: 'src/test/integration-test.ts',
        language: 'typescript',
        project: 'productivity-tracker-test',
        machineId: 'integration-test-machine'
      };
      
      console.log('   📤 Sending activity event...');
      ws.send(JSON.stringify(activityEvent));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('   📥 Received:', message.type);
        
        if (message.type === 'ack') {
          console.log('   ✅ Activity event saved successfully');
          results.activitySaving = true;
          activitySaved = true;
          
          // Request stats after saving activity
          setTimeout(() => {
            console.log('   📊 Requesting current stats...');
            ws.send(JSON.stringify({ type: 'request_stats' }));
          }, 1000);
        }
        
        if (message.type === 'stats') {
          console.log('   ✅ Stats retrieved successfully');
          console.log('   📈 Live stats:', message.data);
          results.statsRetrieval = true;
          
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      } catch (error) {
        console.log('   ❌ Failed to parse WebSocket message');
      }
    });
    
    ws.on('error', (error) => {
      console.log('   ❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('   🔌 WebSocket connection closed');
      clearTimeout(timeout);
      resolve();
    });
  });
}

// Test 4: Dashboard Access
async function testDashboardAccess() {
  console.log('\n4️⃣ Testing Dashboard Access...');
  try {
    const response = await makeRequest(`${config.dashboard}`);
    if (response.status === 200) {
      console.log('   ✅ Dashboard is accessible');
      results.dashboardAccess = true;
    } else {
      console.log('   ❌ Dashboard access failed');
    }
  } catch (error) {
    console.log('   ❌ Dashboard is not responding');
  }
}

// Generate Test Report
function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('📋 INTEGRATION TEST REPORT');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Server Health', status: results.serverHealth },
    { name: 'API Authentication', status: results.apiAuthentication },
    { name: 'WebSocket Connection', status: results.websocketConnection },
    { name: 'Activity Saving', status: results.activitySaving },
    { name: 'Stats Retrieval', status: results.statsRetrieval },
    { name: 'Dashboard Access', status: results.dashboardAccess }
  ];
  
  tests.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
  });
  
  const passed = tests.filter(t => t.status).length;
  const total = tests.length;
  
  console.log('\n' + '-'.repeat(30));
  console.log(`📊 Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The system is fully integrated.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n💡 Next steps:');
  if (results.serverHealth && results.apiAuthentication && results.websocketConnection) {
    console.log('   • Open VSCode and test the extension manually');
    console.log('   • Use Command Palette: "Productivity Tracker: Login with GitHub"');
    console.log('   • Check the status bar for tracking indicator');
    console.log('   • Open dashboard at http://localhost:3000/dashboard');
  } else {
    console.log('   • Make sure server is running: npm run dev:server');
    console.log('   • Make sure dashboard is running: npm run dev:dashboard');
    console.log('   • Check authentication token validity');
  }
}

// Run all tests
async function runIntegrationTests() {
  await testServerHealth();
  await testApiAuthentication();
  await testWebSocketAndActivity();
  await testDashboardAccess();
  
  generateReport();
}

// Start the tests
runIntegrationTests().catch(console.error);
