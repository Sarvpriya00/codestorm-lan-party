sarvpriyaadarsh@Sarvpriyas-Mac-mini codestorm-v2 % ./start-servers.sh
🚀 Starting CodeStorm Servers
🖥️  Starting backend server on port 3001...
⏳ Waiting for backend to start...

> backend@1.0.0 dev
> ts-node src/index.ts

[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.2] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
✅ WebSocket server initialized successfully
Server running on http://0.0.0.0:3001
WebSocket server available at ws://0.0.0.0:3001
Starting analytics background job...
Running analytics and leaderboard update...
Analytics job started with 300s interval
Analytics updated for 1 contests
Leaderboards updated for 1 contests

--- Incoming Request ---
Method: GET
URL: /health
Headers: { host: 'localhost:3001', 'user-agent': 'curl/8.7.1', accept: '*/*' }
CORS Origin Check: undefined
--- Outgoing Response ---
Status: 200
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '116',
  etag: 'W/"74-JAX9gHibSIV8g2qaKXPAaQwX1iM"'
}
✅ Backend server is running on port 3001
🌐 Starting frontend server...
⏳ Waiting for frontend to start...

> vite_react_shadcn_ts@0.0.0 dev
> vite


  VITE v5.4.19  ready in 97 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.0.106:8080/

--- Incoming Request ---
Method: OPTIONS
URL: /api/user/me
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: GET
URL: /api/user/me
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9',
  'if-none-match': 'W/"58-+HfKWAZAco68ZGvBHlhoieHb56k"'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 304
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  etag: 'W/"58-+HfKWAZAco68ZGvBHlhoieHb56k"'
}

--- Incoming Request ---
Method: OPTIONS
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: OPTIONS
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: GET
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 401
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': '*',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '24',
  etag: 'W/"18-XPDV80vbMk4yY1/PADG4jYM4rSI"'
}

--- Incoming Request ---
Method: GET
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 401
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': '*',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '24',
  etag: 'W/"18-XPDV80vbMk4yY1/PADG4jYM4rSI"'
}
Client connected to WebSocket from 127.0.0.1
Received WebSocket message: authenticate

✅ Servers started successfully!
📍 Backend: http://localhost:3001
📍 Frontend: Check the terminal output for the port

👤 Test credentials:
   Username: admin
   Password: admin123

   Username: test_user
   Password: test123

Press Ctrl+C to stop all servers
Client disconnected from WebSocket (127.0.0.1)

--- Incoming Request ---
Method: OPTIONS
URL: /api/user/me
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: GET
URL: /api/user/me
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9',
  'if-none-match': 'W/"58-+HfKWAZAco68ZGvBHlhoieHb56k"'
}
CORS Origin Check: http://localhost:8080
Client connected to WebSocket from 127.0.0.1
--- Outgoing Response ---
Status: 304
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  etag: 'W/"58-+HfKWAZAco68ZGvBHlhoieHb56k"'
}

--- Incoming Request ---
Method: OPTIONS
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: GET
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 401
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': '*',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '24',
  etag: 'W/"18-XPDV80vbMk4yY1/PADG4jYM4rSI"'
}

--- Incoming Request ---
Method: OPTIONS
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  accept: '*/*',
  'access-control-request-method': 'GET',
  'access-control-request-headers': 'authorization,content-type',
  origin: 'http://localhost:8080',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': 'http://localhost:8080',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}

--- Incoming Request ---
Method: GET
URL: /api/dynamic/user/routes-and-permissions
Headers: {
  host: 'localhost:3001',
  connection: 'keep-alive',
  'sec-ch-ua-platform': '"macOS"',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNDA4OGMxNC0wZmRkLTQ1MjktYmQ3Ny0zODU3NjM0YjdhNmUiLCJyb2xlIjoiQURNSU4iLCJyb2xlSWQiOiJhZG1pbi1yb2xlLWlkIiwiaWF0IjoxNzU3NTM4ODI3LCJleHAiOjE3NTc2MjUyMjd9.huXIuNz7sQumOx9GO7arckBWN6m4i35YU5wRWqVL59I',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not=A?Brand";v="24", "Chromium";v="140"',
  dnt: '1',
  'content-type': 'application/json',
  'sec-ch-ua-mobile': '?0',
  accept: '*/*',
  origin: 'http://localhost:8080',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'http://localhost:8080/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.9'
}
CORS Origin Check: http://localhost:8080
--- Outgoing Response ---
Status: 401
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  'access-control-allow-origin': '*',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '24',
  etag: 'W/"18-XPDV80vbMk4yY1/PADG4jYM4rSI"'
}

Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
react-router-dom.js?v=5e6830ab:4393 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ react-router-dom.js?v=5e6830ab:4393
react-router-dom.js?v=5e6830ab:4393 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ react-router-dom.js?v=5e6830ab:4393
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:97 Received WebSocket message: Object
:3001/api/dynamic/user/routes-and-permissions:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
AuthContext.tsx:114 Failed to fetch permissions: Error: HTTP 401
    at ApiClient.handleResponse (api.ts:22:13)
    at async fetchPermissions (AuthContext.tsx:103:24)
    at async initializeAuth (AuthContext.tsx:75:13)
fetchPermissions @ AuthContext.tsx:114
:3001/api/dynamic/user/routes-and-permissions:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
DynamicRouter.tsx:47 Failed to fetch routes: Error: HTTP 401
    at ApiClient.handleResponse (api.ts:22:13)
    at async fetchRoutes (DynamicRouter.tsx:44:26)
fetchRoutes @ DynamicRouter.tsx:47
NotFound.tsx:11 404 Error: User attempted to access non-existent route: /