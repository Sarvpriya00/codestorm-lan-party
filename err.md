sarvpriyaadarsh@Sarvpriyas-MacBook-Air codestorm-v2 % ./start-servers.sh
🚀 Starting CodeStorm Servers
SIGTERM signal received: closing HTTP server
🖥️  Starting backend server on port 3001...
⏳ Waiting for backend to start...

> backend@1.0.0 dev
> ts-node src/index.ts

[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
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
✅ Backend server is running on port 3001
🌐 Starting frontend server...
--- Outgoing Response ---
Status: 200
⏳ Waiting for frontend to start...
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  vary: 'Origin',
  'access-control-allow-credentials': 'true',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '116',
  etag: 'W/"74-KTgs523jwRd84PH4OgpjMXaTuiE"'
}

> vite_react_shadcn_ts@0.0.0 dev
> vite


  VITE v5.4.19  ready in 280 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://10.3.145.7:8080/

✅ Servers started successfully!
📍 Backend: http://localhost:3001
📍 Frontend: Check the terminal output for the port

👤 Test credentials:
   Username: admin
   Password: admin123

   Username: test_user
   Password: test123

Press Ctrl+C to stop all servers

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
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
}
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}
HTTP server closed
HTTP server closed
HTTP server closed
HTTP server closed
HTTP server closed
HTTP server closed
Client disconnected from WebSocket (127.0.0.1)
Client connected to WebSocket from 127.0.0.1
Received WebSocket message: login
WebSocket login attempt for user: admin
User admin logged in successfully via WebSocket
Received WebSocket message: authenticate

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
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
}
--- Outgoing Response ---
Status: 204
Headers: [Object: null prototype] {
  'x-powered-by': 'Express',
  vary: 'Origin, Access-Control-Request-Headers',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'access-control-allow-headers': 'authorization,content-type',
  'content-length': '0'
}
full log 
0 verbose cli /opt/homebrew/Cellar/node/24.3.0/bin/node /opt/homebrew/bin/npm
1 info using npm@11.4.2
2 info using node@v24.3.0
3 silly config load:file:/opt/homebrew/lib/node_modules/npm/npmrc
4 silly config load:file:/Users/sarvpriyaadarsh/Desktop/code/Amity/.npmrc
5 silly config load:file:/Users/sarvpriyaadarsh/.npmrc
6 silly config load:file:/opt/homebrew/etc/npmrc
7 verbose title npm run dev
8 verbose argv "run" "dev"
9 verbose logfile logs-max:10 dir:/Users/sarvpriyaadarsh/.npm/_logs/2025-09-11T05_49_46_607Z-
10 verbose logfile /Users/sarvpriyaadarsh/.npm/_logs/2025-09-11T05_49_46_607Z-debug-0.log
11 silly logfile start cleaning logs, removing 1 files
12 verbose stack Error: Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/sarvpriyaadarsh/Desktop/code/Amity/package.json'
12 verbose stack     at async open (node:internal/fs/promises:640:25)
12 verbose stack     at async readFile (node:internal/fs/promises:1244:14)
12 verbose stack     at async read (/opt/homebrew/lib/node_modules/npm/node_modules/@npmcli/package-json/lib/read-package.js:9:18)
12 verbose stack     at async PackageJson.load (/opt/homebrew/lib/node_modules/npm/node_modules/@npmcli/package-json/lib/index.js:132:31)
12 verbose stack     at async PackageJson.normalize (/opt/homebrew/lib/node_modules/npm/node_modules/@npmcli/package-json/lib/index.js:118:5)
12 verbose stack     at async #run (/opt/homebrew/lib/node_modules/npm/lib/commands/run.js:90:13)
12 verbose stack     at async RunScript.exec (/opt/homebrew/lib/node_modules/npm/lib/commands/run.js:44:7)
12 verbose stack     at async Npm.exec (/opt/homebrew/lib/node_modules/npm/lib/npm.js:208:9)
12 verbose stack     at async module.exports (/opt/homebrew/lib/node_modules/npm/lib/cli/entry.js:67:5)
13 error code ENOENT
14 error syscall open
15 error path /Users/sarvpriyaadarsh/Desktop/code/Amity/package.json
16 error errno -2
17 error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/sarvpriyaadarsh/Desktop/code/Amity/package.json'
18 error enoent This is related to npm not being able to find a file.
18 error enoent
19 verbose cwd /Users/sarvpriyaadarsh/Desktop/code/Amity
20 verbose os Darwin 24.6.0
21 verbose node v24.3.0
22 verbose npm  v11.4.2
23 verbose exit -2
24 verbose code -2
25 error A complete log of this run can be found in: /Users/sarvpriyaadarsh/.npm/_logs/2025-09-11T05_49_46_607Z-debug-0.log

frontend console log 
React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ react-router-dom.js?v=02342d8c:4393
react-router-dom.js?v=02342d8c:4393 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ react-router-dom.js?v=02342d8c:4393
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:97 Received WebSocket message: Object
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
websocket.ts:97 Received WebSocket message: Object
AuthContext.tsx:132 WebSocket login response: Object
AuthContext.tsx:143 Destructured token, user, and permissions: Object
websocket.ts:97 Received WebSocket message: Object
websocket.ts:102 WebSocket authenticated
(index):1 Access to fetch at 'http://localhost:3001/api/dynamic/user/routes-and-permissions' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
:3001/api/dynamic/user/routes-and-permissions:1  Failed to load resource: net::ERR_FAILED
hook.js:608 Failed to fetch routes: Error: CORS error: Unable to connect to backend. Please check if the backend server is running and CORS is properly configured.
    at ApiClient.makeRequest (api.ts:34:15)
    at async fetchRoutes (DynamicRouter.tsx:44:26)
overrideMethod @ hook.js:608
hook.js:608 404 Error: User attempted to access non-existent route: / Error Component Stack
    at NotFound (NotFound.tsx:8:20)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Suspense (<anonymous>)
    at DynamicRouter (DynamicRouter.tsx:33:31)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Router (react-router-dom.js?v=02342d8c:4501:15)
    at BrowserRouter (react-router-dom.js?v=02342d8c:5247:5)
    at Provider (chunk-PLT6GTVM.js?v=02342d8c:38:15)
    at TooltipProvider (@radix-ui_react-tooltip.js?v=02342d8c:62:5)
    at AuthProvider (AuthContext.tsx:58:61)
    at QueryClientProvider (@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608