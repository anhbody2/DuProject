'use strict';

const { DataTypes, pk, timestamps, foreignKey } = require('../helpers');

/** product_review_replies: any signed-in user can comment on an existing product review. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'product_review_replies',
        {
          id: pk(),
          review_id: { type: DataTypes.BIGINT, allowNull: false },
          user_id: { type: DataTypes.BIGINT, allowNull: false },
          comment: { type: DataTypes.TEXT, allowNull: false },
          ...timestamps(),
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'product_review_replies',
        name: 'product_review_replies_review_fk',
        column: 'review_id',
        refTable: 'product_reviews',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'product_review_replies',
        name: 'product_review_replies_user_fk',
        column: 'user_id',
        refTable: 'users',
        onDelete: 'CASCADE',
      });
      await queryInterface.sequelize.query(
        `ALTER TABLE product_review_replies ADD CONSTRAINT product_review_replies_comment_check CHECK (char_length(comment) BETWEEN 1 AND 1000)`,
        { transaction },
      );
      await queryInterface.addIndex('product_review_replies', ['review_id', 'created_at'], {
        name: 'idx_product_review_replies_review_id_created_at',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_review_replies');
  },
};
