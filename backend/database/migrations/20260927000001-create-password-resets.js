'use strict';

const { DataTypes, pk, createdAt, foreignKey, check, gte } = require('../helpers');

/** password_resets: one-time email codes for the forgot-password flow. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'password_resets',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
          code_hash: { type: DataTypes.STRING(255), allowNull: false },
          attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          expires_at: { type: DataTypes.DATE, allowNull: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'password_resets',
        name: 'password_resets_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'password_resets',
        name: 'password_resets_attempts_check',
        fields: ['attempts'],
        where: { attempts: gte(0) },
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('password_resets');
  },
};
