import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as WebSocket from 'ws';
import authRouter from './routes/auth';
import problemRouter from './routes/problem';
import judgeRouter from './routes/judge'; // Import judge router

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware to parse JSON bodies
app.use(express.json());

// Use auth router
app.use('/api/auth', authRouter);

// Use problem router
app.use('/api', problemRouter);

// Use judge router
app.use('/api/judge', judgeRouter); // Use judge router for /api/judge routes

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (message: string) => {
    console.log(`Received: ${message}`);
    // Echo back message
    ws.send(`You said: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// Basic API route
app.get('/', (req, res) => {
  res.send('CodeStorm Backend is running!');
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});
