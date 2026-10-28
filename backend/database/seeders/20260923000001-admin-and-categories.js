'use strict';

const bcrypt = require('bcryptjs');

const CATEGORIES = [
  { name: 'Cơm', slug: 'com' },
  { name: 'Bún', slug: 'bun' },
  { name: 'Xôi', slug: 'xoi' },
  { name: 'Bánh mì', slug: 'banh-mi' },
  { name: 'Đồ ăn vặt', slug: 'do-an-vat' },
  { name: 'Nước', slug: 'nuoc' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const username = process.env.ADMIN_USERNAME || 'admin123';
    const email = (process.env.ADMIN_EMAIL || 'admin123@gmail.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '1234568@A';

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [admin] = await queryInterface.bulkInsert(
        'users',
        [
          {
            username,
            email,
            password_hash: await bcrypt.hash(password, 10),
            role: 'admin',
            status: 'active',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction, returning: ['id'] },
      );
      await queryInterface.bulkInsert(
        'profiles',
        [{ user_id: admin.id, first_name: 'System', last_name: 'Admin', created_at: now, updated_at: now }],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'categories',
        CATEGORIES.map((c) => ({ ...c, created_at: now, updated_at: now })),
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('categories', {
      slug: { [Op.in]: CATEGORIES.map((c) => c.slug) },
    });
    await queryInterface.bulkDelete('users', {
      email: (process.env.ADMIN_EMAIL || 'admin123@gmail.com').toLowerCase(),
    });
  },
};
