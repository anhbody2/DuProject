'use strict';

const { DataTypes } = require('../helpers');

/**
 * users.refresh_token_hash: SHA-256 (hex) of the user's current refresh token.
 * NULL = no active refresh session (never logged in, logged out, or revoked).
 * Only the hash is stored, so a leaked database row can't be replayed as a token.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('users', 'refresh_token_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'refresh_token_hash');
  },
};
