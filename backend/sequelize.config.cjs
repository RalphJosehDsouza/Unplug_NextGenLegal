require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const config = {
  url: databaseUrl,
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
  timezone: '+05:30',
};

module.exports = {
  development: config,
  test: config,
  production: config,
};

