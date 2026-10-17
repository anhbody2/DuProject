'use strict';

const { DataTypes } = require('sequelize');

/**
 * Soft delete for stores and products (Sequelize `paranoid`): DELETE sets deleted_at
 * instead of removing the row, so order history, reviews and reports keep their links.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of ['stores', 'products']) {
        await queryInterface.addColumn(table, 'deleted_at', { type: DataTypes.DATE, allowNull: true }, { transaction });
      }
      // Almost every query filters on "not deleted".
      await queryInterface.addIndex('stores', ['deleted_at'], { name: 'idx_stores_deleted_at', transaction });
      await queryInterface.addIndex('products', ['store_id', 'deleted_at'], { name: 'idx_products_store_deleted_at', transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('products', 'idx_products_store_deleted_at', { transaction });
      await queryInterface.removeIndex('stores', 'idx_stores_deleted_at', { transaction });
      // Note: rows soft-deleted while this was applied become visible again.
      for (const table of ['products', 'stores']) {
        await queryInterface.removeColumn(table, 'deleted_at', { transaction });
      }
    });
  },
};
