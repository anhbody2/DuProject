'use strict';

/**
 * Wipes all data: drops and recreates the public schema (tables, extensions and the
 * sequelize_meta / sequelize_data history go with it) and empties UPLOAD_DIR.
 * `npm run db:reset` then runs every migration and seeder again.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

async function main() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  try {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
    await sequelize.query('CREATE SCHEMA public');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public');
  } finally {
    await sequelize.close();
  }
  console.log(`Dropped all data in ${config.database}@${config.host}:${config.port}`);

  // Empty the folder but keep it: in Docker it is a mounted volume.
  if (fs.existsSync(UPLOAD_DIR)) {
    for (const entry of fs.readdirSync(UPLOAD_DIR)) {
      fs.rmSync(path.join(UPLOAD_DIR, entry), { recursive: true, force: true });
    }
    console.log(`Emptied ${UPLOAD_DIR}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
