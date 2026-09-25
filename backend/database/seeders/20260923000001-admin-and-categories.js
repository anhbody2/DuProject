'use strict';

const bcrypt = require('bcryptjs');

const CATEGORIES = [
  { name: 'Vietnamese', slug: 'vietnamese' },
  { name: 'Fast Food', slug: 'fast-food' },
  { name: 'Drinks', slug: 'drinks' },
  { name: 'Desserts', slug: 'desserts' },
];

const CHILD_CATEGORIES = [
  { parent: 'vietnamese', name: 'Pho', slug: 'pho' },
  { parent: 'vietnamese', name: 'Banh Mi', slug: 'banh-mi' },
  { parent: 'drinks', name: 'Coffee', slug: 'coffee' },
  { parent: 'drinks', name: 'Milk Tea', slug: 'milk-tea' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

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

      const parents = await queryInterface.bulkInsert(
        'categories',
        CATEGORIES.map((c) => ({ ...c, created_at: now, updated_at: now })),
        { transaction, returning: ['id', 'slug'] },
      );
      const parentIds = Object.fromEntries(parents.map((p) => [p.slug, p.id]));
      await queryInterface.bulkInsert(
        'categories',
        CHILD_CATEGORIES.map(({ parent, ...c }) => ({
          ...c,
          parent_id: parentIds[parent],
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('categories', {
      slug: { [Op.in]: [...CHILD_CATEGORIES, ...CATEGORIES].map((c) => c.slug) },
    });
    await queryInterface.bulkDelete('users', {
      email: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
    });
  },
};
