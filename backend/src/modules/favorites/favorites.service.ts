import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  FavoriteProduct,
  FavoriteStore,
  Product,
  ProductImage,
  Store,
} from '../../database/models';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(FavoriteStore) private readonly favoriteStores: typeof FavoriteStore,
    @InjectModel(FavoriteProduct) private readonly favoriteProducts: typeof FavoriteProduct,
    @InjectModel(Store) private readonly stores: typeof Store,
    @InjectModel(Product) private readonly products: typeof Product,
  ) {}

  listStores(userId: number) {
    return this.favoriteStores.findAll({
      where: { userId },
      include: [{ model: Store, attributes: ['id', 'name', 'slug', 'logoUrl', 'status'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async addStore(userId: number, storeId: number) {
    if (!(await this.stores.count({ where: { id: storeId } }))) throw new NotFoundException('Store not found');
    const [favorite] = await this.favoriteStores.findOrCreate({ where: { userId, storeId } });
    return favorite;
  }

  async removeStore(userId: number, storeId: number) {
    await this.favoriteStores.destroy({ where: { userId, storeId } });
  }

  listProducts(userId: number) {
    return this.favoriteProducts.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug', 'price', 'salePrice', 'status', 'storeId'],
          include: [{ model: ProductImage, where: { isPrimary: true }, required: false }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async addProduct(userId: number, productId: number) {
    if (!(await this.products.count({ where: { id: productId } }))) throw new NotFoundException('Product not found');
    const [favorite] = await this.favoriteProducts.findOrCreate({ where: { userId, productId } });
    return favorite;
  }

  async removeProduct(userId: number, productId: number) {
    await this.favoriteProducts.destroy({ where: { userId, productId } });
  }
}
