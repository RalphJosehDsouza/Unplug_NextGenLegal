import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import { connectDb } from './config/db.js';
import { connectRedis } from './config/redis.js';

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
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] NextGenLegal API listening on port ${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});

