'use strict';

const { DataTypes, pk, createdAt, foreignKey, check, unique, oneOf } = require('../helpers');

/** social_accounts: Google / Facebook identities linked to a user. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'social_accounts',
        {
          id: pk(),
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          provider: { type: DataTypes.STRING(20), allowNull: false },
          provider_user_id: { type: DataTypes.STRING(255), allowNull: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'social_accounts',
        name: 'social_accounts_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await check(queryInterface, transaction, {
        table: 'social_accounts',
        name: 'social_accounts_provider_check',
        fields: ['provider'],
        where: { provider: oneOf(['google', 'facebook']) },
      });
      // One identity maps to one user; a user has at most one account per provider.
      await unique(queryInterface, transaction, {
        table: 'social_accounts',
        name: 'social_accounts_provider_uid_key',
        fields: ['provider', 'provider_user_id'],
      });
      await unique(queryInterface, transaction, {
        table: 'social_accounts',
        name: 'social_accounts_user_provider_key',
        fields: ['user_id', 'provider'],
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('social_accounts');
  },
};
