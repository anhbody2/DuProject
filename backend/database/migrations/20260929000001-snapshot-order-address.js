'use strict';

const { DataTypes } = require('../helpers');

/**
 * orders.delivery_address: a copy of the address taken at checkout.
 * delivery_address_id is ON DELETE SET NULL, so without the copy an order lost
 * its destination when the customer deleted (or edited) the saved address.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'orders',
        'delivery_address',
        { type: DataTypes.JSONB },
        { transaction },
      );
      // Orders whose address was already deleted stay NULL; nothing is left to copy.
      await queryInterface.sequelize.query(
        `UPDATE orders o
            SET delivery_address = jsonb_build_object(
              'label', a.label,
              'recipientName', a.recipient_name,
              'phone', a.phone,
              'addressLine', a.address_line,
              'ward', a.ward,
              'district', a.district,
              'city', a.city,
              'latitude', a.latitude,
              'longitude', a.longitude)
           FROM addresses a
          WHERE a.id = o.delivery_address_id`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'delivery_address');
  },
};
