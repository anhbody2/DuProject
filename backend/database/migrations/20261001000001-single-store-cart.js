'use strict';

/**
 * Carts now hold dishes from one store only (GrabFood / ShopeeFood model).
 *
 * Data: a cart that mixes stores keeps the store of its most recently added line;
 * the other stores' lines are deleted (their cart_item_options go with them, ON DELETE
 * CASCADE). Orders are not touched: orders placed before the rule may still span
 * several stores and keep working.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `WITH latest AS (
         SELECT DISTINCT ON (ci.cart_id) ci.cart_id, p.store_id
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         ORDER BY ci.cart_id, ci.created_at DESC, ci.id DESC
       )
       DELETE FROM cart_items ci
       USING products p, latest l
       WHERE p.id = ci.product_id
         AND l.cart_id = ci.cart_id
         AND p.store_id <> l.store_id`,
    );
  },

  // The deleted lines can't be brought back; the rule itself lives in CartService.
  async down() {},
};
