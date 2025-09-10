import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';
import cors from 'cors'; // Import cors
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
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for frontend
app.use(cors({ origin: 'http://localhost:8080' }));

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
  res.send('CodeStorm Backend is running!');
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
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
