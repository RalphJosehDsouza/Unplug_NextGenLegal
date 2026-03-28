import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions:
    process.env.NODE_ENV === 'production'
      ? { ssl: { rejectUnauthorized: false } }
      : undefined,
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

export async function connectDb({ retries = 10, minDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.query('SELECT 1');
      return;
    } catch (err) {
      lastErr = err;
      const delay = Math.min(minDelayMs * 2 ** (attempt - 1), 10000);
      // eslint-disable-next-line no-console
      console.warn(`[db] connect attempt ${attempt}/${retries} failed: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

