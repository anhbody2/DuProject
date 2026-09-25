'use strict';

const { DataTypes, pk, timestamps, foreignKey, check, unique, gt } = require('../helpers');

/** carts, cart_items */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ---------------- CARTS ----------------
      await queryInterface.createTable(
        'carts',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'carts',
        name: 'carts_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });

      // ---------------- CART ITEMS ----------------
      await queryInterface.createTable(
        'cart_items',
        {
          id: pk(),
          cart_id: { type: DataTypes.BIGINT, allowNull: false },
          product_id: { type: DataTypes.BIGINT, allowNull: false },
          quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'cart_items',
        name: 'cart_items_cart_fk',
        column: 'cart_id',
        refTable: 'carts',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'cart_items',
        name: 'cart_items_product_fk',
        column: 'product_id',
        refTable: 'products',
        onDelete: 'RESTRICT',
      });
      await check(queryInterface, transaction, {
        table: 'cart_items',
        name: 'cart_items_quantity_check',
        fields: ['quantity'],
        where: { quantity: gt(0) },
      });
      await unique(queryInterface, transaction, {
        table: 'cart_items',
        name: 'cart_items_unique',
        fields: ['cart_id', 'product_id'],
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('cart_items', { transaction });
      await queryInterface.dropTable('carts', { transaction });
    });
  },
};
