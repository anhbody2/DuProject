'use strict';

const { DataTypes, pk, timestamps, foreignKey, check, oneOf } = require('../helpers');

/** users, profiles, addresses */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ---------------- USERS ----------------
      await queryInterface.createTable(
        'users',
        {
          id: pk(),
          username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
          email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
          password_hash: { type: DataTypes.STRING(255), allowNull: false },
          role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'customer' },
          status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'active' },
          ...timestamps(),
        },
        { transaction },
      );
      await check(queryInterface, transaction, {
        table: 'users',
        name: 'users_role_check',
        fields: ['role'],
        where: { role: oneOf(['customer', 'store_owner', 'admin']) },
      });
      await check(queryInterface, transaction, {
        table: 'users',
        name: 'users_status_check',
        fields: ['status'],
        where: { status: oneOf(['active', 'inactive', 'suspended']) },
      });

      // ---------------- PROFILES ----------------
      await queryInterface.createTable(
        'profiles',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
          first_name: { type: DataTypes.STRING(100) },
          last_name: { type: DataTypes.STRING(100) },
          phone: { type: DataTypes.STRING(30) },
          avatar_url: { type: DataTypes.TEXT },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'profiles',
        name: 'profiles_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });

      // ---------------- ADDRESSES ----------------
      await queryInterface.createTable(
        'addresses',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          label: { type: DataTypes.STRING(50) },
          recipient_name: { type: DataTypes.STRING(150), allowNull: false },
          phone: { type: DataTypes.STRING(30), allowNull: false },
          address_line: { type: DataTypes.TEXT, allowNull: false },
          ward: { type: DataTypes.STRING(100) },
          district: { type: DataTypes.STRING(100) },
          city: { type: DataTypes.STRING(100) },
          latitude: { type: DataTypes.DECIMAL(10, 7) },
          longitude: { type: DataTypes.DECIMAL(10, 7) },
          is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'addresses',
        name: 'addresses_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('addresses', { transaction });
      await queryInterface.dropTable('profiles', { transaction });
      await queryInterface.dropTable('users', { transaction });
    });
  },
};
