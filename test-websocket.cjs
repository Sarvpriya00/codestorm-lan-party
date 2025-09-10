const WebSocket = require('ws');

// Test WebSocket connection to backend
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
  console.log('✅ WebSocket connected to backend');
  
  // Test login
  ws.send(JSON.stringify({
    type: 'login',
    payload: {
      username: 'test_user',
      password: 'test123'
    }
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  if (response.type === 'login_success') {
    console.log('✅ Login successful!');
  } else if (response.type === 'login_error') {
    console.log('❌ Login failed:', response.payload.message);
  }
  
  // Close after receiving response
  setTimeout(() => ws.close(), 1000);
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
});