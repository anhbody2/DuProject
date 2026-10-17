'use strict';

const { DataTypes, pk, createdAt, timestamps, foreignKey, check, unique, oneOf } = require('../helpers');

/**
 * Chat: conversations, their participants and messages.
 * - 'direct': two users. key = 'direct:<lowId>:<highId>'.
 * - 'support': one user and the admin team. key = 'support:<userId>'. The user is the
 *   only participant row; any admin may read and reply, and `staff_read_at` is the
 *   team's shared read marker.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'conversations',
        {
          id: pk(),
          type: { type: DataTypes.STRING(20), allowNull: false },
          key: { type: DataTypes.STRING(60), allowNull: false },
          last_message_at: { type: DataTypes.DATE, allowNull: true },
          staff_read_at: { type: DataTypes.DATE, allowNull: true },
          ...timestamps(),
        },
        { transaction },
      );
      await check(queryInterface, transaction, {
        table: 'conversations',
        name: 'conversations_type_check',
        fields: ['type'],
        where: { type: oneOf(['direct', 'support']) },
      });
      await unique(queryInterface, transaction, {
        table: 'conversations',
        name: 'conversations_key_key',
        fields: ['key'],
      });

      await queryInterface.createTable(
        'conversation_participants',
        {
          id: pk(),
          conversation_id: { type: DataTypes.BIGINT, allowNull: false },
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          last_read_at: { type: DataTypes.DATE, allowNull: true },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'conversation_participants',
        name: 'conversation_participants_conversation_fk',
        column: 'conversation_id',
        refTable: 'conversations',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'conversation_participants',
        name: 'conversation_participants_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await unique(queryInterface, transaction, {
        table: 'conversation_participants',
        name: 'conversation_participants_conversation_user_key',
        fields: ['conversation_id', 'user_id'],
      });

      await queryInterface.createTable(
        'messages',
        {
          id: pk(),
          conversation_id: { type: DataTypes.BIGINT, allowNull: false },
          sender_id: { type: DataTypes.BIGINT, allowNull: false },
          body: { type: DataTypes.TEXT, allowNull: false },
          ...createdAt(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'messages',
        name: 'messages_conversation_fk',
        column: 'conversation_id',
        refTable: 'conversations',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'messages',
        name: 'messages_sender_fk',
        column: 'sender_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await queryInterface.sequelize.query(
        `ALTER TABLE messages ADD CONSTRAINT messages_body_check CHECK (char_length(body) BETWEEN 1 AND 2000)`,
        { transaction },
      );

      await queryInterface.addIndex('conversation_participants', ['user_id'], {
        name: 'idx_conversation_participants_user_id',
        transaction,
      });
      await queryInterface.addIndex('conversations', ['type', 'last_message_at'], {
        name: 'idx_conversations_type_last_message_at',
        transaction,
      });
      await queryInterface.addIndex('messages', ['conversation_id', 'id'], {
        name: 'idx_messages_conversation_id_id',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversation_participants');
    await queryInterface.dropTable('conversations');
  },
};
