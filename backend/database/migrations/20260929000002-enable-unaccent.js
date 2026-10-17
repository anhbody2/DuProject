'use strict';

/**
 * Accent-insensitive search (B10): `unaccent('Cơm tấm') = 'Com tam'`.
 * unaccent is a trusted extension since PostgreSQL 13, so the database owner can create it.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS unaccent');
  },
};
