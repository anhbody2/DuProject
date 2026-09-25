'use strict';

const {
  DataTypes,
  Op,
  Sequelize,
  pk,
  createdAt,
  timestamps,
  foreignKey,
  check,
  unique,
  oneOf,
  gte,
} = require('../helpers');

/** products, product_images, option_groups, options */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ---------------- PRODUCTS ----------------
      await queryInterface.createTable(
        'products',
        {
          id: pk(),
          store_id: { type: DataTypes.BIGINT, allowNull: false },
          category_id: { type: DataTypes.BIGINT, allowNull: false },
          name: { type: DataTypes.STRING(255), allowNull: false },
          slug: { type: DataTypes.STRING(255), allowNull: false },
          description: { type: DataTypes.TEXT },
          price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          sale_price: { type: DataTypes.DECIMAL(12, 2) },
          stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'active' },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'products',
        name: 'products_store_fk',
        column: 'store_id',
        refTable: 'stores',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'products',
        name: 'products_category_fk',
        column: 'category_id',
        refTable: 'categories',
        onDelete: 'RESTRICT',
      });
      await check(queryInterface, transaction, {
        table: 'products',
        name: 'products_price_check',
        fields: ['price'],
        where: { price: gte(0) },
      });
      await check(queryInterface, transaction, {
        table: 'products',
        name: 'products_sale_price_check',
        fields: ['sale_price'],
        where: { [Op.or]: [{ sale_price: null }, { sale_price: gte(0) }] },
      });
      await check(queryInterface, transaction, {
        table: 'products',
        name: 'products_stock_check',
        fields: ['stock'],
        where: { stock: gte(0) },
      });
      await check(queryInterface, transaction, {
        table: 'products',
        name: 'products_status_check',
        fields: ['status'],
        where: { status: oneOf(['active', 'inactive', 'out_of_stock']) },
      });
      await unique(queryInterface, transaction, {
        table: 'products',
        name: 'products_store_slug_unique',
        fields: ['store_id', 'slug'],
      });

      // ---------------- PRODUCT IMAGES ----------------
      await queryInterface.createTable(
        'product_images',
        {
          id: pk(),
          product_id: { type: DataTypes.BIGINT, allowNull: false },
          image_url: { type: DataTypes.TEXT, allowNull: false },
          sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'product_images',
        name: 'product_images_product_fk',
        column: 'product_id',
        refTable: 'products',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'product_images',
        name: 'product_images_sort_order_check',
        fields: ['sort_order'],
        where: { sort_order: gte(0) },
      });

      // ---------------- OPTION GROUPS ----------------
      await queryInterface.createTable(
        'option_groups',
        {
          id: pk(),
          product_id: { type: DataTypes.BIGINT, allowNull: false },
          name: { type: DataTypes.STRING(100), allowNull: false },
          min_selection: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          max_selection: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
          required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'option_groups',
        name: 'option_groups_product_fk',
        column: 'product_id',
        refTable: 'products',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'option_groups',
        name: 'option_groups_min_check',
        fields: ['min_selection'],
        where: { min_selection: gte(0) },
      });
      await check(queryInterface, transaction, {
        table: 'option_groups',
        name: 'option_groups_max_check',
        fields: ['max_selection', 'min_selection'],
        where: { max_selection: gte(Sequelize.col('min_selection')) },
      });

      // ---------------- OPTIONS ----------------
      await queryInterface.createTable(
        'options',
        {
          id: pk(),
          option_group_id: { type: DataTypes.BIGINT, allowNull: false },
          name: { type: DataTypes.STRING(100), allowNull: false },
          price_modifier: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'options',
        name: 'options_group_fk',
        column: 'option_group_id',
        refTable: 'option_groups',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'options',
        name: 'options_price_modifier_check',
        fields: ['price_modifier'],
        where: { price_modifier: gte(0) },
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('options', { transaction });
      await queryInterface.dropTable('option_groups', { transaction });
      await queryInterface.dropTable('product_images', { transaction });
      await queryInterface.dropTable('products', { transaction });
    });
  },
};
