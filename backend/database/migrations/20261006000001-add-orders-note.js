'use strict';

const { DataTypes } = require('../helpers');

/**
 * orders.note: the customer's free-text note typed at checkout
 * ("ít cay", "gọi trước khi giao"...). Optional; NULL when left blank.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('orders', 'note', { type: DataTypes.STRING(500) });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'note');
  },
};
