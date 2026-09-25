'use strict';

const {
  DataTypes,
  pk,
  createdAt,
  timestamps,
  foreignKey,
  check,
  unique,
  oneOf,
} = require('../helpers');

/** stores, store_locations, store_members, categories, store_categories */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ---------------- STORES ----------------
      await queryInterface.createTable(
        'stores',
        {
          id: pk(),
          owner_id: { type: DataTypes.BIGINT, allowNull: false },
          name: { type: DataTypes.STRING(255), allowNull: false },
          slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
          description: { type: DataTypes.TEXT },
          logo_url: { type: DataTypes.TEXT },
          cover_url: { type: DataTypes.TEXT },
          phone: { type: DataTypes.STRING(30) },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'stores',
        name: 'stores_owner_fk',
        column: 'owner_id',
        refTable: 'users',
        onDelete: 'RESTRICT',
      });
      await check(queryInterface, transaction, {
        table: 'stores',
        name: 'stores_status_check',
        fields: ['status'],
        where: { status: oneOf(['pending', 'active', 'inactive', 'suspended']) },
      });

      // ---------------- STORE LOCATIONS ----------------
      await queryInterface.createTable(
        'store_locations',
        {
          id: pk(),
          store_id: { type: DataTypes.BIGINT, allowNull: false },
          address_line: { type: DataTypes.TEXT, allowNull: false },
          ward: { type: DataTypes.STRING(100) },
          district: { type: DataTypes.STRING(100) },
          city: { type: DataTypes.STRING(100) },
          latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
          longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
          is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'store_locations',
        name: 'store_locations_store_fk',
        column: 'store_id',
        refTable: 'stores',
        onDelete: 'CASCADE',
      });

      // ---------------- STORE MEMBERS ----------------
      await queryInterface.createTable(
        'store_members',
        {
          id: pk(),
          store_id: { type: DataTypes.BIGINT, allowNull: false },
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'staff' },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'store_members',
        name: 'store_members_store_fk',
        column: 'store_id',
        refTable: 'stores',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'store_members',
        name: 'store_members_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'store_members',
        name: 'store_members_role_check',
        fields: ['role'],
        where: { role: oneOf(['owner', 'manager', 'staff']) },
      });
      await unique(queryInterface, transaction, {
        table: 'store_members',
        name: 'store_members_unique',
        fields: ['store_id', 'user_id'],
      });

      // ---------------- CATEGORIES ----------------
      await queryInterface.createTable(
        'categories',
        {
          id: pk(),
          parent_id: { type: DataTypes.BIGINT },
          name: { type: DataTypes.STRING(100), allowNull: false },
          slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'categories',
        name: 'categories_parent_fk',
        column: 'parent_id',
        refTable: 'categories',
        onDelete: 'SET NULL',
      });

      // ---------------- STORE CATEGORIES ----------------
      await queryInterface.createTable(
        'store_categories',
        {
          store_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
          category_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'store_categories',
        name: 'store_categories_store_fk',
        column: 'store_id',
        refTable: 'stores',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'store_categories',
        name: 'store_categories_category_fk',
        column: 'category_id',
        refTable: 'categories',
        onDelete: 'CASCADE',
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('store_categories', { transaction });
      await queryInterface.dropTable('categories', { transaction });
      await queryInterface.dropTable('store_members', { transaction });
      await queryInterface.dropTable('store_locations', { transaction });
      await queryInterface.dropTable('stores', { transaction });
    });
  },
};
