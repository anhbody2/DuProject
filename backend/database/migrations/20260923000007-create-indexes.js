'use strict';

// [indexName, table, columns]
const INDEXES = [
  ['idx_addresses_user_id', 'addresses', ['user_id']],
  ['idx_stores_owner_id', 'stores', ['owner_id']],
  ['idx_store_locations_store_id', 'store_locations', ['store_id']],
  ['idx_store_locations_coordinates', 'store_locations', ['latitude', 'longitude']],
  ['idx_store_members_store_id', 'store_members', ['store_id']],
  ['idx_store_members_user_id', 'store_members', ['user_id']],
  ['idx_store_categories_category_id', 'store_categories', ['category_id']],
  ['idx_products_store_id', 'products', ['store_id']],
  ['idx_products_category_id', 'products', ['category_id']],
  ['idx_products_status', 'products', ['status']],
  ['idx_product_images_product_id', 'product_images', ['product_id']],
  ['idx_option_groups_product_id', 'option_groups', ['product_id']],
  ['idx_options_option_group_id', 'options', ['option_group_id']],
  ['idx_cart_items_cart_id', 'cart_items', ['cart_id']],
  ['idx_orders_user_id', 'orders', ['user_id']],
  ['idx_orders_status', 'orders', ['status']],
  ['idx_store_orders_order_id', 'store_orders', ['order_id']],
  ['idx_store_orders_store_id', 'store_orders', ['store_id']],
  ['idx_store_orders_status', 'store_orders', ['status']],
  ['idx_order_items_store_order_id', 'order_items', ['store_order_id']],
  ['idx_order_items_product_id', 'order_items', ['product_id']],
  ['idx_payments_order_id', 'payments', ['order_id']],
  ['idx_deliveries_order_id', 'deliveries', ['order_id']],
  ['idx_store_reviews_store_id', 'store_reviews', ['store_id']],
  ['idx_product_reviews_product_id', 'product_reviews', ['product_id']],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const [name, table, fields] of INDEXES) {
        await queryInterface.addIndex(table, fields, { name, transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const [name, table] of [...INDEXES].reverse()) {
        await queryInterface.removeIndex(table, name, { transaction });
      }
    });
  },
};
