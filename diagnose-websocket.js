const WebSocket = require('ws');
const http = require('http');

console.log('🔍 Diagnosing WebSocket Connection Issues\n');

// Test 1: Check if backend server is running
console.log('1️⃣  Testing HTTP connection to backend...');
const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
}, (res) => {
    console.log(`✅ HTTP Status: ${res.statusCode}`);

    // Test 2: Try WebSocket connection
    console.log('\n2️⃣  Testing WebSocket connection...');
    testWebSocket();
});

req.on('error', (err) => {
    console.log(`❌ HTTP connection failed: ${err.message}`);
    console.log('💡 Make sure the backend server is running on port 3000');
    process.exit(1);
});

req.end();

function testWebSocket() {
    const ws = new WebSocket('ws://localhost:3000');
    let connected = false;

    const timeout = setTimeout(() => {
        if (!connected) {
            console.log('❌ WebSocket connection timeout');
            ws.close();
            process.exit(1);
        }
    }, 5000);

    ws.on('open', function open() {
        connected = true;
        clearTimeout(timeout);
        console.log('✅ WebSocket connected successfully');

        // Test 3: Send a test message
        console.log('\n3️⃣  Testing WebSocket messaging...');
        ws.send(JSON.stringify({
            type: 'ping',
            payload: { message: 'test' }
        }));
    });

    ws.on('message', function message(data) {
        const response = JSON.parse(data.toString());
        console.log('📨 Received message:', response.type);

        if (response.type === 'connected') {
            console.log('✅ WebSocket handshake successful');

            // Test login
            console.log('\n4️⃣  Testing login functionality...');
            ws.send(JSON.stringify({
                type: 'login',
                payload: {
                    username: 'test_user',
                    password: 'test123'
                }
            }));
        } else if (response.type === 'login_success') {
            console.log('✅ Login successful!');
            console.log('👤 User:', response.payload.user.username);
            console.log('🔑 Permissions:', response.payload.permissions.length);
            ws.close();
        } else if (response.type === 'login_error') {
            console.log('❌ Login failed:', response.payload.message);
            ws.close();
        }
    });

    ws.on('error', function error(err) {
        console.error('❌ WebSocket error:', err.message);
        process.exit(1);
    });

    ws.on('close', function close() {
        console.log('\n🔌 WebSocket connection closed');
        console.log('\n✅ Diagnosis complete!');
    });
}