'use strict';

const {
  DataTypes,
  pk,
  createdAt,
  timestamps,
  foreignKey,
  check,
  oneOf,
  gte,
  gt,
  ORDER_STATUSES,
} = require('../helpers');

/** orders, store_orders, order_items, order_item_options, payments, deliveries */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const nonNegative = async (table, prefix, columns) => {
        for (const [column, suffix] of columns) {
          await check(queryInterface, transaction, {
            table,
            name: `${prefix}_${suffix}_check`,
            fields: [column],
            where: { [column]: gte(0) },
          });
        }
      };

      // ---------------- ORDERS ----------------
      await queryInterface.createTable(
        'orders',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          delivery_address_id: { type: DataTypes.BIGINT },
          subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          delivery_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'orders',
        name: 'orders_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'RESTRICT',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'orders',
        name: 'orders_address_fk',
        column: 'delivery_address_id',
        refTable: 'addresses',
        onDelete: 'SET NULL',
      });
      await nonNegative('orders', 'orders', [
        ['subtotal', 'subtotal'],
        ['delivery_fee', 'delivery_fee'],
        ['discount', 'discount'],
        ['total', 'total'],
      ]);
      await check(queryInterface, transaction, {
        table: 'orders',
        name: 'orders_status_check',
        fields: ['status'],
        where: { status: oneOf(ORDER_STATUSES) },
      });

      // ---------------- STORE ORDERS ----------------
      await queryInterface.createTable(
        'store_orders',
        {
          id: pk(),
          order_id: { type: DataTypes.BIGINT, allowNull: false },
          store_id: { type: DataTypes.BIGINT, allowNull: false },
          subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          delivery_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          commission_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'store_orders',
        name: 'store_orders_order_fk',
        column: 'order_id',
        refTable: 'orders',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'store_orders',
        name: 'store_orders_store_fk',
        column: 'store_id',
        refTable: 'stores',
        onDelete: 'RESTRICT',
      });
      await nonNegative('store_orders', 'store_orders', [
        ['subtotal', 'subtotal'],
        ['delivery_fee', 'delivery_fee'],
        ['commission_amount', 'commission'],
      ]);
      await check(queryInterface, transaction, {
        table: 'store_orders',
        name: 'store_orders_status_check',
        fields: ['status'],
        where: { status: oneOf(ORDER_STATUSES) },
      });

      // ---------------- ORDER ITEMS ----------------
      await queryInterface.createTable(
        'order_items',
        {
          id: pk(),
          store_order_id: { type: DataTypes.BIGINT, allowNull: false },
          product_id: { type: DataTypes.BIGINT },
          product_name: { type: DataTypes.STRING(255), allowNull: false },
          unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          quantity: { type: DataTypes.INTEGER, allowNull: false },
          subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'order_items',
        name: 'order_items_store_order_fk',
        column: 'store_order_id',
        refTable: 'store_orders',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'order_items',
        name: 'order_items_product_fk',
        column: 'product_id',
        refTable: 'products',
        onDelete: 'SET NULL',
      });
      await nonNegative('order_items', 'order_items', [
        ['unit_price', 'unit_price'],
        ['subtotal', 'subtotal'],
      ]);
      await check(queryInterface, transaction, {
        table: 'order_items',
        name: 'order_items_quantity_check',
        fields: ['quantity'],
        where: { quantity: gt(0) },
      });

      // ---------------- ORDER ITEM OPTIONS ----------------
      await queryInterface.createTable(
        'order_item_options',
        {
          id: pk(),
          order_item_id: { type: DataTypes.BIGINT, allowNull: false },
          option_name: { type: DataTypes.STRING(100), allowNull: false },
          price_modifier: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'order_item_options',
        name: 'order_item_options_item_fk',
        column: 'order_item_id',
        refTable: 'order_items',
        onDelete: 'CASCADE',
      });
      await nonNegative('order_item_options', 'order_item_options', [['price_modifier', 'price']]);
      await check(queryInterface, transaction, {
        table: 'order_item_options',
        name: 'order_item_options_quantity_check',
        fields: ['quantity'],
        where: { quantity: gt(0) },
      });

      // ---------------- PAYMENTS ----------------
      await queryInterface.createTable(
        'payments',
        {
          id: pk(),
          order_id: { type: DataTypes.BIGINT, allowNull: false },
          method: { type: DataTypes.STRING(30), allowNull: false },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
          amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          transaction_id: { type: DataTypes.STRING(255) },
          paid_at: { type: DataTypes.DATE },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'payments',
        name: 'payments_order_fk',
        column: 'order_id',
        refTable: 'orders',
        onDelete: 'CASCADE',
      });
      await nonNegative('payments', 'payments', [['amount', 'amount']]);
      await check(queryInterface, transaction, {
        table: 'payments',
        name: 'payments_method_check',
        fields: ['method'],
        where: { method: oneOf(['cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay', 'card']) },
      });
      await check(queryInterface, transaction, {
        table: 'payments',
        name: 'payments_status_check',
        fields: ['status'],
        where: { status: oneOf(['pending', 'paid', 'failed', 'refunded']) },
      });

      // ---------------- DELIVERIES ----------------
      await queryInterface.createTable(
        'deliveries',
        {
          id: pk(),
          order_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
          delivery_address_id: { type: DataTypes.BIGINT },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
          delivery_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          estimated_at: { type: DataTypes.DATE },
          picked_up_at: { type: DataTypes.DATE },
          delivered_at: { type: DataTypes.DATE },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'deliveries',
        name: 'deliveries_order_fk',
        column: 'order_id',
        refTable: 'orders',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'deliveries',
        name: 'deliveries_address_fk',
        column: 'delivery_address_id',
        refTable: 'addresses',
        onDelete: 'SET NULL',
      });
      await nonNegative('deliveries', 'deliveries', [['delivery_fee', 'fee']]);
      await check(queryInterface, transaction, {
        table: 'deliveries',
        name: 'deliveries_status_check',
        fields: ['status'],
        where: {
          status: oneOf(['pending', 'assigned', 'picked_up', 'delivering', 'delivered', 'cancelled']),
        },
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('deliveries', { transaction });
      await queryInterface.dropTable('payments', { transaction });
      await queryInterface.dropTable('order_item_options', { transaction });
      await queryInterface.dropTable('order_items', { transaction });
      await queryInterface.dropTable('store_orders', { transaction });
      await queryInterface.dropTable('orders', { transaction });
    });
  },
};
