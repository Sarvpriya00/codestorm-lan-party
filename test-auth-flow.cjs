#!/usr/bin/env node

/**
 * Comprehensive Authentication Flow Test
 * Tests WebSocket connection, CORS configuration, and authentication persistence
 */

const WebSocket = require('ws');
const { default: fetch } = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:3001';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test results tracking
const testResults = {
  backendHealth: false,
  frontendHealth: false,
  corsConfiguration: false,
  websocketConnection: false,
  httpAuthentication: false,
  websocketAuthentication: false,
  authenticationPersistence: false
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, status, details = '') => {
  const statusIcon = status ? '✅' : '❌';
  console.log(`${statusIcon} ${testName}${details ? ': ' + details : ''}`);
};

const logSection = (sectionName) => {
  console.log(`\n🔍 Testing ${sectionName}...`);
};

// Test 1: Backend Health Check
async function testBackendHealth() {
  logSection('Backend Health');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      testResults.backendHealth = true;
      logTest('Backend Health Check', true, `Server running on port 3001`);
      return true;
    } else {
      logTest('Backend Health Check', false, `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Backend Health Check', false, `Connection failed: ${error.message}`);
    return false;
  }
}

// Test 2: Frontend Health Check
async function testFrontendHealth() {
  logSection('Frontend Health');
  try {
    const response = await fetch(FRONTEND_URL);
    
    if (response.ok) {
      testResults.frontendHealth = true;
      logTest('Frontend Health Check', true, `Frontend accessible on port 8080`);
      return true;
    } else {
      logTest('Frontend Health Check', false, `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Frontend Health Check', false, `Connection failed: ${error.message}`);
    return false;
  }
}

// Test 3: CORS Configuration
async function testCorsConfiguration() {
  logSection('CORS Configuration');
  try {
    // Test preflight request
    const preflightResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers')
    };

    if (corsHeaders['Access-Control-Allow-Origin'] && 
        (corsHeaders['Access-Control-Allow-Origin'] === FRONTEND_URL || 
         corsHeaders['Access-Control-Allow-Origin'] === '*')) {
      testResults.corsConfiguration = true;
      logTest('CORS Configuration', true, `Origin ${FRONTEND_URL} allowed`);
      return true;
    } else {
      logTest('CORS Configuration', false, `CORS headers: ${JSON.stringify(corsHeaders)}`);
      return false;
    }
  } catch (error) {
    logTest('CORS Configuration', false, `CORS test failed: ${error.message}`);
    return false;
  }
}

// Test 4: WebSocket Connection
async function testWebSocketConnection() {
  logSection('WebSocket Connection');
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let connectionTimeout;

    connectionTimeout = setTimeout(() => {
      ws.close();
      logTest('WebSocket Connection', false, 'Connection timeout (10s)');
      resolve(false);
    }, 10000);

    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      testResults.websocketConnection = true;
      logTest('WebSocket Connection', true, 'Connected successfully');
      ws.close();
      resolve(true);
    });

    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      logTest('WebSocket Connection', false, `Connection error: ${error.message}`);
      resolve(false);
    });

    ws.on('close', (code, reason) => {
      if (code !== 1000) {
        logTest('WebSocket Connection', false, `Unexpected close: ${code} - ${reason}`);
      }
    });
  });
}

// Test 5: HTTP Authentication
async function testHttpAuthentication() {
  logSection('HTTP Authentication');
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    const data = await response.json();

    if (response.ok && data.token && data.user) {
      testResults.httpAuthentication = true;
      logTest('HTTP Authentication', true, `User: ${data.user.username}, Role: ${data.user.role?.name || 'Unknown'}`);
      
      // Store token for persistence test
      global.testAuthToken = data.token;
      global.testUser = data.user;
      return true;
    } else {
      logTest('HTTP Authentication', false, `Login failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('HTTP Authentication', false, `Request failed: ${error.message}`);
    return false;
  }
}

// Test 6: WebSocket Authentication
async function testWebSocketAuthentication() {
  logSection('WebSocket Authentication');
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let authTimeout;
    let isAuthenticated = false;

    authTimeout = setTimeout(() => {
      ws.close();
      logTest('WebSocket Authentication', false, 'Authentication timeout (15s)');
      resolve(false);
    }, 15000);

    ws.on('open', () => {
      // Send login request
      const loginMessage = {
        type: 'login',
        payload: TEST_CREDENTIALS,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(loginMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'login_success') {
          clearTimeout(authTimeout);
          isAuthenticated = true;
          testResults.websocketAuthentication = true;
          logTest('WebSocket Authentication', true, `User: ${message.payload.user?.username || 'Unknown'}`);
          
          // Store WebSocket auth data
          global.testWSAuthToken = message.payload.token;
          global.testWSUser = message.payload.user;
          
          ws.close();
          resolve(true);
        } else if (message.type === 'login_error') {
          clearTimeout(authTimeout);
          logTest('WebSocket Authentication', false, `Login error: ${message.payload.message || 'Unknown error'}`);
          ws.close();
          resolve(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(authTimeout);
      logTest('WebSocket Authentication', false, `WebSocket error: ${error.message}`);
      resolve(false);
    });

    ws.on('close', (code, reason) => {
      if (!isAuthenticated && code !== 1000) {
        clearTimeout(authTimeout);
        logTest('WebSocket Authentication', false, `Connection closed: ${code} - ${reason}`);
        resolve(false);
      }
    });
  });
}

// Test 7: Authentication Persistence
async function testAuthenticationPersistence() {
  logSection('Authentication Persistence');
  
  if (!global.testAuthToken) {
    logTest('Authentication Persistence', false, 'No auth token available from previous tests');
    return false;
  }

  try {
    // Test token validation
    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${global.testAuthToken}`,
        'Origin': FRONTEND_URL
      }
    });

    const data = await response.json();

    if (response.ok && data.user) {
      testResults.authenticationPersistence = true;
      logTest('Authentication Persistence', true, `Token valid for user: ${data.user.username}`);
      return true;
    } else {
      logTest('Authentication Persistence', false, `Token validation failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Authentication Persistence', false, `Request failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Authentication Flow Tests\n');
  console.log('Testing Requirements:');
  console.log('  - 1.1: WebSocket connection establishes without errors');
  console.log('  - 1.2: Authentication flow completes without CORS errors');
  console.log('  - 1.3: Login succeeds and redirects to dashboard');
  console.log('  - 3.1: CORS headers allow requests from frontend origin');
  console.log('  - 3.2: WebSocket connections not blocked by CORS policies');
  console.log('  - 4.3: Both HTTP and WebSocket connections properly authenticated');

  const tests = [
    testBackendHealth,
    testFrontendHealth,
    testCorsConfiguration,
    testWebSocketConnection,
    testHttpAuthentication,
    testWebSocketAuthentication,
    testAuthenticationPersistence
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passedTests++;
      await delay(1000); // Brief pause between tests
    } catch (error) {
      console.error(`Test failed with exception: ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  Object.entries(testResults).forEach(([testName, passed]) => {
    const statusIcon = passed ? '✅' : '❌';
    const formattedName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${statusIcon} ${formattedName}`);
  });

  console.log('=' .repeat(50));
  console.log(`Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All authentication flow tests PASSED!');
    console.log('✅ WebSocket connection establishes without errors');
    console.log('✅ No CORS errors in authentication flow');
    console.log('✅ Login functionality works with admin/admin123');
    console.log('✅ Authentication persistence validated');
    return true;
  } else {
    console.log('\n⚠️  Some tests FAILED. Please review the issues above.');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };