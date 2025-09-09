sarvpriyaadarsh@Sarvpriyas-MacBook-Air backend % npm run build

> backend@1.0.0 build
> tsc

src/tests/database/migration.test.ts:496:6 - error TS1005: '}' expected.

496   });
         

  src/tests/database/migration.test.ts:9:66
    9 describe('Database Migration and Schema Validation Tests', () => {
                                                                       ~
    The parser expected to find a '}' to match the '{' token here.


Found 1 error in src/tests/database/migration.test.ts:496

sarvpriyaadarsh@Sarvpriyas-MacBook-Air backend % npm run start

> backend@1.0.0 start
> node dist/index.js

[dotenv@17.2.2] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-lan-party/backend/dist/routes/problem.js:8
router.get('/problems', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRoles)([client_1.Role.ADMIN, client_1.Role.JUDGE, client_1.Role.PARTICIPANT]), problemController_1.getProblems);
                                                                                                  ^

ReferenceError: client_1 is not defined
    at Object.<anonymous> (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-lan-party/backend/dist/routes/problem.js:8:99)
    at Module._compile (node:internal/modules/cjs/loader:1692:14)
    at Object..js (node:internal/modules/cjs/loader:1824:10)
    at Module.load (node:internal/modules/cjs/loader:1427:32)
    at Module._load (node:internal/modules/cjs/loader:1250:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1449:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-lan-party/backend/dist/index.js:43:35)

Node.js v24.3.0