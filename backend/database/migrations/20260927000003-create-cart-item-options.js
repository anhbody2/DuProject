'use strict';

const { DataTypes, foreignKey } = require('../helpers');

// Mirrors DEFAULT_SIZE_GROUP in src/modules/products/product-options.ts.
const SIZE_GROUP = 'Kích cỡ';
const SIZES = [
  ['S', 0],
  ['M', 10000],
];

/**
 * cart_item_options: the options chosen for a cart line. The same product with a
 * different selection (size S vs M) is a separate line, so cart_items_unique goes.
 *
 * Data: every product without a size group gets a required "Kích cỡ" group
 * (S +0, M +10.000đ), and existing cart lines get the first available option of
 * each required group so they stay checkout-able.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'cart_item_options',
        {
          cart_item_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
          option_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
        },
        { transaction },
      );
      await foreignKey(queryInterface, transaction, {
        table: 'cart_item_options',
        name: 'cart_item_options_item_fk',
        column: 'cart_item_id',
        refTable: 'cart_items',
        onDelete: 'CASCADE',
      });
      await foreignKey(queryInterface, transaction, {
        table: 'cart_item_options',
        name: 'cart_item_options_option_fk',
        column: 'option_id',
        refTable: 'options',
        onDelete: 'CASCADE',
      });
      await queryInterface.removeConstraint('cart_items', 'cart_items_unique', { transaction });

      await queryInterface.sequelize.query(
        `WITH g AS (
           INSERT INTO option_groups (product_id, name, min_selection, max_selection, required)
           SELECT p.id, :group, 1, 1, true
           FROM products p
           WHERE NOT EXISTS (
             SELECT 1 FROM option_groups og
             WHERE og.product_id = p.id AND lower(og.name) IN ('size', lower(:group))
           )
           RETURNING id
         )
         INSERT INTO options (option_group_id, name, price_modifier)
         SELECT g.id, v.name, v.price::numeric
         FROM g CROSS JOIN (VALUES ${SIZES.map((_, i) => `(:n${i}, :p${i}, ${i})`).join(', ')}) AS v(name, price, ord)
         ORDER BY g.id, v.ord`,
        {
          replacements: {
            group: SIZE_GROUP,
            ...Object.fromEntries(SIZES.flatMap(([n, p], i) => [[`n${i}`, n], [`p${i}`, p]])),
          },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO cart_item_options (cart_item_id, option_id)
         SELECT ci.id, first_opt.id
         FROM cart_items ci
         JOIN option_groups og ON og.product_id = ci.product_id AND (og.required OR og.min_selection > 0)
         CROSS JOIN LATERAL (
           SELECT o.id FROM options o
           WHERE o.option_group_id = og.id AND o.is_available
           ORDER BY o.id LIMIT 1
         ) first_opt`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('cart_item_options', { transaction });
      // Lines that differed only by options collapse back to one per product.
      await queryInterface.sequelize.query(
        `DELETE FROM cart_items a USING cart_items b
         WHERE a.cart_id = b.cart_id AND a.product_id = b.product_id AND a.id > b.id`,
        { transaction },
      );
      await queryInterface.addConstraint('cart_items', {
        type: 'unique',
        name: 'cart_items_unique',
        fields: ['cart_id', 'product_id'],
        transaction,
      });
      await queryInterface.sequelize.query('DELETE FROM option_groups WHERE name = :group', {
        replacements: { group: SIZE_GROUP },
        transaction,
      });
    });
  },
};
