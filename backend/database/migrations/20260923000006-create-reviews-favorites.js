'use strict';

const {
  DataTypes,
  Op,
  pk,
  createdAt,
  timestamps,
  foreignKey,
  check,
  unique,
} = require('../helpers');

/** store_reviews, product_reviews, favorite_stores, favorite_products */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ---------------- STORE / PRODUCT REVIEWS ----------------
      for (const [table, target, targetTable] of [
        ['store_reviews', 'store', 'stores'],
        ['product_reviews', 'product', 'products'],
      ]) {
        await queryInterface.createTable(
          table,
          {
            id: pk(),
            [`${target}_id`]: { type: DataTypes.BIGINT, allowNull: false },
            user_id: { type: DataTypes.BIGINT, allowNull: false },
            order_id: { type: DataTypes.BIGINT, allowNull: false },
            rating: { type: DataTypes.INTEGER, allowNull: false },
            comment: { type: DataTypes.TEXT },
            ...timestamps(),
          },
          { transaction },
        );
        await foreignKey(queryInterface, transaction, {
          table,
          name: `${table}_${target}_fk`,
          column: `${target}_id`,
          refTable: targetTable,
          onDelete: 'CASCADE',
        });
        await foreignKey(queryInterface, transaction, {
          table,
          name: `${table}_user_fk`,
          column: 'user_id',
          refTable: 'users',
          onDelete: 'CASCADE',
        });
        await foreignKey(queryInterface, transaction, {
          table,
          name: `${table}_order_fk`,
          column: 'order_id',
          refTable: 'orders',
          onDelete: 'CASCADE',
        });
        await check(queryInterface, transaction, {
          table,
          name: `${table}_rating_check`,
          fields: ['rating'],
          where: { rating: { [Op.between]: [1, 5] } },
        });
        await unique(queryInterface, transaction, {
          table,
          name: `${table}_unique`,
          fields: [`${target}_id`, 'user_id', 'order_id'],
        });
      }

      // ---------------- FAVORITE STORES / PRODUCTS ----------------
      for (const [table, target, targetTable] of [
        ['favorite_stores', 'store', 'stores'],
        ['favorite_products', 'product', 'products'],
      ]) {
        await queryInterface.createTable(
          table,
          {
            user_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
            [`${target}_id`]: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
            ...createdAt(),
          },
          { transaction },
        );
        await foreignKey(queryInterface, transaction, {
          table,
          name: `${table}_user_fk`,
          column: 'user_id',
          refTable: 'users',
          onDelete: 'CASCADE',
        });
        await foreignKey(queryInterface, transaction, {
          table,
          name: `${table}_${target}_fk`,
          column: `${target}_id`,
          refTable: targetTable,
          onDelete: 'CASCADE',
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('favorite_products', { transaction });
      await queryInterface.dropTable('favorite_stores', { transaction });
      await queryInterface.dropTable('product_reviews', { transaction });
      await queryInterface.dropTable('store_reviews', { transaction });
    });
  },
};
