require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

module.exports = {
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

