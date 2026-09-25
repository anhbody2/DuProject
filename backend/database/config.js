// Used by sequelize-cli (migrations & seeders). The Nest app reads the same env vars.
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'food_marketplace',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: false,
  migrationStorageTableName: 'sequelize_meta',
  // Track executed seeders so they only run once.
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
