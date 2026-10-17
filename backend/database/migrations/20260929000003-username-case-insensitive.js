'use strict';

/**
 * B18: usernames are unique regardless of case, so "Admin" can't be registered next to "admin".
 * Fails with a clear message (and changes nothing) if case-only duplicates already exist;
 * rename one of each pair, then run the migration again.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [dupes] = await queryInterface.sequelize.query(
        `SELECT lower(username) AS name, string_agg(username || ' (#' || id || ')', ', ' ORDER BY id) AS accounts
           FROM users GROUP BY lower(username) HAVING count(*) > 1`,
        { transaction },
      );
      if (dupes.length) {
        throw new Error(
          `Usernames that differ only by case must be renamed first: ${dupes.map((d) => d.accounts).join('; ')}`,
        );
      }
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username))',
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_username_lower_key');
  },
};
