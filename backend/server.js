import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import { connectDb } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initializeSocket } from './config/socket.js';
import http from 'http';
import dns from 'dns';
import './models/User.js';   // 🔴 REQUIRED
dns.setDefaultResultOrder('ipv4first');

async function start() {
  // Initialize DB (with retries) before accepting requests.
  await connectDb();

  // Redis isn't required for auth, but initializing it early surfaces misconfiguration.
  try {
    await connectRedis();
  } catch {
    // If Redis is down, keep the API up (depending on your features you may want to fail fast).
  }

  const port = Number(process.env.PORT) || 4000;
  
  // Create HTTP server for Socket.io
  const server = http.createServer(app);
  
  // Initialize Socket.io
  const io = initializeSocket(server);
  
  // Attach io to app for access in routes if needed
  app.locals.io = io;

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] NextGenLegal API listening on port ${port}`);
    console.log(`[server] WebRTC Socket.io initialized`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});