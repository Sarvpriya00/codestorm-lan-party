import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';
const cors = require('cors'); // Import cors
import authRouter from './routes/auth';
import problemRouter from './routes/problem';
import submissionRouter from './routes/submission';
import judgeRouter from './routes/judge';
import adminRouter from './routes/admin';
import publicRouter from './routes/public'; // Import public router
import contestRouter from './routes/contest';
import analyticsRouter from './routes/analytics';
import leaderboardRouter from './routes/leaderboard';
import attendanceRouter from './routes/attendance';
import userRouter from './routes/user';
import dynamicRouter from './routes/dynamic';
import { initWebSocket } from './services/websocketService';
import { auditLogMiddleware } from './middleware/auditMiddleware'; // Import audit middleware
import { analyticsJobService } from './services/analyticsJobService';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Add this logging middleware right after app initialization
app.use((req, res, next) => {
  console.log(`
--- Incoming Request ---`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Headers:`, req.headers);

  // Log response headers when the response finishes
  res.on('finish', () => {
    console.log(`--- Outgoing Response ---`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.getHeaders());
  });
  next();
});

// Enable CORS for frontend (should be one of the first middlewares)
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('CORS Origin Check:', origin); // Log the origin being checked
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Use audit log middleware globally
app.use(auditLogMiddleware);

// Use auth router
app.use('/api/auth', authRouter);

// Use problem router
app.use('/api', problemRouter);

// Use submission router
app.use('/api', submissionRouter);

// Use judge router
app.use('/api/judge', judgeRouter);

// Use admin router
app.use('/api/admin', adminRouter);

// Use contest router
app.use('/api', contestRouter);

// Use analytics router
app.use('/api/analytics', analyticsRouter);

// Use leaderboard router
app.use('/api', leaderboardRouter);

// Use attendance router
app.use('/api/attendance', attendanceRouter);

// Use user router
app.use('/api/user', userRouter);

// Use dynamic router
app.use('/api/dynamic', dynamicRouter);

// Use public router
app.use('/api', publicRouter); // Use public router for /api routes

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server); // Use the service to initialize WebSocket

// Basic API route
app.get('/', (req, res) => {
  res.json({
    message: 'CodeStorm Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    websocket: 'Available'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websocket: 'active'
    }
  });
});

// Start the server
server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`WebSocket server available at ws://0.0.0.0:${port}`);
  
  // Start analytics background job
  analyticsJobService.start();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  analyticsJobService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  analyticsJobService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});
