'use strict';

const { check, oneOf } = require('../helpers');

/** users.role gains 'member': a customer who has added a store to the market. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('users', 'users_role_check', { transaction });
      await check(queryInterface, transaction, {
        table: 'users',
        name: 'users_role_check',
        fields: ['role'],
        where: { role: oneOf(['customer', 'member', 'store_owner', 'admin']) },
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate('users', { role: 'customer' }, { role: 'member' }, { transaction });
      await queryInterface.removeConstraint('users', 'users_role_check', { transaction });
      await check(queryInterface, transaction, {
        table: 'users',
        name: 'users_role_check',
        fields: ['role'],
        where: { role: oneOf(['customer', 'store_owner', 'admin']) },
      });
    });
  },
};
