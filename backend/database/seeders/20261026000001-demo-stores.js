'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Demo marketplace: three Đà Nẵng stores, each with its store_owner account and menu.
 * Coordinates were geocoded once through VietMap (/api/geo) and are fixed here, so
 * seeding needs no API key. Prices are in VND.
 *
 * Photos come from database/seed-images (PNGs extracted from store-img/*.svg). Each is
 * copied into UPLOAD_DIR/images under a UUID name, exactly like POST /uploads/images,
 * so owners can keep or replace them from the dashboard.
 */
const PASSWORD = '1234568@A';
const STOCK = 100;
const SEED_IMAGES = path.join(__dirname, '..', 'seed-images');
const IMAGES_DIR = path.join(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'), 'images');

/** Copies a seed image into the uploads folder and returns its public path. */
function upload(file) {
  const name = `${randomUUID()}${path.extname(file)}`;
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  fs.copyFileSync(path.join(SEED_IMAGES, file), path.join(IMAGES_DIR, name));
  return `/api/uploads/images/${name}`;
}

const STORES = [
  {
    owner: { username: 'dungcao1997', email: 'dungcao1997@gmail.com', firstName: 'Dung', lastName: 'Cao' },
    name: 'Bún Cô Dung',
    slug: 'bun-co-dung',
    cover: 'buntai.png',
    description: 'Bún bò tái, nạm, chả, gân, xương.',
    category: 'bun',
    // VietMap has no house number here; the point is on Xô Viết Nghệ Tĩnh (Hòa Cường).
    location: { address: '213 Xô Viết Nghệ Tĩnh', ward: 'Phường Hòa Cường', lat: 16.033288, lng: 108.22605 },
    products: [
      { name: 'Bún tái', slug: 'bun-tai', price: 25000, category: 'bun', image: 'buntai.png' },
      { name: 'Bún nạm', slug: 'bun-nam', price: 25000, category: 'bun', image: 'bunnam.png' },
      { name: 'Bún chả', slug: 'bun-cha', price: 25000, category: 'bun', image: 'buncha.png' },
      { name: 'Bún gân', slug: 'bun-gan', price: 25000, category: 'bun' },
      { name: 'Bún xương', slug: 'bun-xuong', price: 25000, category: 'bun', image: 'bunxuong.png' },
      { name: 'Sữa đậu', slug: 'sua-dau', price: 10000, category: 'nuoc', image: 'suadau.png' },
      { name: 'Bánh tráng', slug: 'banh-trang', price: 10000, category: 'do-an-vat', image: 'banhtrangnuong.png' },
    ],
  },
  {
    owner: { username: 'muoimuoi123', email: 'muoimuoi123@gmai.com', firstName: 'Mười', lastName: 'Bà' },
    name: 'Xôi Bà Mười',
    slug: 'xoi-ba-muoi',
    cover: 'xoitom.png',
    description: 'Xôi tôm, thịt, gà, trứng, cá nục kho.',
    category: 'xoi',
    location: { address: '3 Quang Trung', ward: 'Phường Hải Châu', lat: 16.0753019, lng: 108.2230155 },
    products: [
      { name: 'Xôi tôm', slug: 'xoi-tom', price: 30000, category: 'xoi', image: 'xoitom.png' },
      { name: 'Xôi thịt', slug: 'xoi-thit', price: 30000, category: 'xoi', image: 'xoithit.png' },
      { name: 'Xôi gà', slug: 'xoi-ga', price: 30000, category: 'xoi', image: 'xoiga.png' },
      { name: 'Xôi trứng', slug: 'xoi-trung', price: 30000, category: 'xoi' },
      { name: 'Xôi cá nục kho', slug: 'xoi-ca-nuc-kho', price: 30000, category: 'xoi', image: 'xoicakho.png' },
    ],
  },
  {
    owner: { username: 'du', email: 'du@gmail.com', firstName: 'Dủ', lastName: null },
    name: 'Cơm Nhà Dủ',
    slug: 'com-nha-du',
    cover: 'comxaoduabo.png',
    description: 'Cơm gà, cơm xào dưa bò, cơm cá kho.',
    category: 'com',
    location: { address: '12 Trần Văn Dư', ward: 'Phường Ngũ Hành Sơn', lat: 16.040438, lng: 108.242854 },
    products: [
      { name: 'Cơm gà', slug: 'com-ga', price: 25000, category: 'com' },
      { name: 'Cơm xào dưa bò', slug: 'com-xao-dua-bo', price: 35000, category: 'com', image: 'comxaoduabo.png' },
      { name: 'Cơm cá kho', slug: 'com-ca-kho', price: 30000, category: 'com' },
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const stamps = { created_at: now, updated_at: now };
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [categories] = await queryInterface.sequelize.query('SELECT id, slug FROM categories', { transaction });
      const categoryId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

      for (const s of STORES) {
        const [owner] = await queryInterface.bulkInsert(
          'users',
          [{ username: s.owner.username, email: s.owner.email, password_hash: passwordHash, role: 'store_owner', status: 'active', ...stamps }],
          { transaction, returning: ['id'] },
        );
        await queryInterface.bulkInsert(
          'profiles',
          [{ user_id: owner.id, first_name: s.owner.firstName, last_name: s.owner.lastName, ...stamps }],
          { transaction },
        );

        const [store] = await queryInterface.bulkInsert(
          'stores',
          [
            {
              owner_id: owner.id,
              name: s.name,
              slug: s.slug,
              description: s.description,
              cover_url: s.cover ? upload(s.cover) : null,
              status: 'active',
              ...stamps,
            },
          ],
          { transaction, returning: ['id'] },
        );
        await queryInterface.bulkInsert('store_members', [{ store_id: store.id, user_id: owner.id, role: 'owner', ...stamps }], {
          transaction,
        });
        await queryInterface.bulkInsert(
          'store_locations',
          [
            {
              store_id: store.id,
              address_line: s.location.address,
              ward: s.location.ward,
              city: 'Thành phố Đà Nẵng',
              latitude: s.location.lat,
              longitude: s.location.lng,
              is_primary: true,
              created_at: now,
            },
          ],
          { transaction },
        );
        await queryInterface.bulkInsert('store_categories', [{ store_id: store.id, category_id: categoryId[s.category] }], {
          transaction,
        });

        const products = await queryInterface.bulkInsert(
          'products',
          s.products.map((p) => ({
            store_id: store.id,
            category_id: categoryId[p.category],
            name: p.name,
            slug: p.slug,
            price: p.price,
            stock: STOCK,
            status: 'active',
            ...stamps,
          })),
          { transaction, returning: ['id', 'slug'] },
        );
        const productId = Object.fromEntries(products.map((p) => [p.slug, p.id]));
        const images = s.products
          .filter((p) => p.image)
          .map((p) => ({ product_id: productId[p.slug], image_url: upload(p.image), sort_order: 0, is_primary: true, created_at: now }));
        if (images.length) await queryInterface.bulkInsert('product_images', images, { transaction });
      }
    });
  },

  async down(queryInterface) {
    const { Op } = require('sequelize');
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Locations, members, store_categories and products cascade from stores.
      await queryInterface.bulkDelete('stores', { slug: { [Op.in]: STORES.map((s) => s.slug) } }, { transaction });
      await queryInterface.bulkDelete('users', { email: { [Op.in]: STORES.map((s) => s.owner.email) } }, { transaction });
    });
  },
};
