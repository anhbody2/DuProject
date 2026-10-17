import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { fromCents, toCents } from '../../common/utils/money';
import {
  Cart,
  CartItem,
  CartItemOption,
  OptionGroup,
  Product,
  ProductImage,
  ProductOption,
  Store,
} from '../../database/models';
import { defaultOptionIds, resolveOptions } from '../products/product-options';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

const optionKey = (ids: number[]) => [...ids].sort((a, b) => a - b).join(',');

/** Error code of the 409 sent when a dish from a second store is added (see AddCartItemDto.replaceCart). */
export const CART_STORE_CONFLICT = 'CART_STORE_CONFLICT';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart) private readonly carts: typeof Cart,
    @InjectModel(CartItem) private readonly items: typeof CartItem,
    @InjectModel(CartItemOption) private readonly itemOptions: typeof CartItemOption,
    @InjectModel(Product) private readonly products: typeof Product,
    private readonly sequelize: Sequelize,
  ) {}

  async getCart(userId: number) {
    const cart = await this.ensureCart(userId);
    const items = await this.items.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug', 'price', 'salePrice', 'stock', 'status', 'storeId'],
          include: [
            { model: Store, attributes: ['id', 'name', 'slug', 'logoUrl', 'status'] },
            { model: ProductImage, where: { isPrimary: true }, required: false, attributes: ['imageUrl'] },
          ],
        },
        {
          model: ProductOption,
          attributes: ['id', 'optionGroupId', 'name', 'priceModifier', 'isAvailable'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // S and M of one dish draw on the same stock.
    const qtyByProduct = new Map<number, number>();
    for (const i of items) qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.quantity);

    let subtotal = 0;
    const lines = items.map((item) => {
      const p = item.product!;
      const options = item.options ?? [];
      const unitPrice =
        toCents(p.salePrice ?? p.price) + options.reduce((sum, o) => sum + toCents(o.priceModifier), 0);
      const lineTotal = unitPrice * item.quantity;
      const available =
        p.status === 'active' &&
        p.store?.status === 'active' &&
        p.stock >= qtyByProduct.get(p.id)! &&
        options.every((o) => o.isAvailable);
      if (available) subtotal += lineTotal;
      return {
        ...item.toJSON(),
        unitPrice: fromCents(unitPrice),
        lineTotal: fromCents(lineTotal),
        available,
      };
    });

    return {
      id: cart.id,
      // Every line belongs to this store (one store per cart); null when the cart is empty.
      store: items[0]?.product?.store ?? null,
      items: lines,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: fromCents(subtotal),
    };
  }

  /**
   * Adds to the line with the same product and options, or starts a new one.
   * A cart only holds one store's dishes: a dish from another store is refused
   * (409 CART_STORE_CONFLICT) unless `replaceCart` empties the cart first.
   */
  async addItem(userId: number, dto: AddCartItemDto) {
    const cart = await this.ensureCart(userId);
    const product = await this.purchasableProduct(dto.productId);
    const options = resolveOptions(product, dto.optionIds ?? defaultOptionIds(product));
    const key = optionKey(options.map((o) => o.id));

    await this.sequelize.transaction(async (transaction) => {
      // Serialize adds to the same cart so two tabs can't mix stores.
      await this.carts.findByPk(cart.id, { transaction, lock: transaction.LOCK.UPDATE });

      const current = await this.cartStore(cart.id, transaction);
      if (current && current.id !== product.storeId) {
        if (!dto.replaceCart) {
          throw new ConflictException({
            statusCode: 409,
            error: 'Conflict',
            code: CART_STORE_CONFLICT,
            message: `Your cart has dishes from "${current.name}". Empty it to order from "${product.store!.name}".`,
            cartStore: current,
          });
        }
        await this.items.destroy({ where: { cartId: cart.id }, transaction });
      }

      const lines = await this.productLines(cart.id, dto.productId, transaction);
      const existing = lines.find((l) => optionKey((l.options ?? []).map((o) => o.id)) === key);
      this.assertStock(product, lines.reduce((n, l) => n + l.quantity, 0) + dto.quantity);

      if (existing) {
        await existing.update({ quantity: existing.quantity + dto.quantity }, { transaction });
      } else {
        const item = await this.items.create(
          { cartId: cart.id, productId: dto.productId, quantity: dto.quantity },
          { transaction },
        );
        await this.itemOptions.bulkCreate(
          options.map((o) => ({ cartItemId: item.id, optionId: o.id })),
          { transaction },
        );
      }
    });
    return this.getCart(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.findItem(userId, itemId);
    const product = await this.purchasableProduct(item.productId);
    const others = (await this.productLines(item.cartId, item.productId)).filter((l) => l.id !== item.id);
    this.assertStock(product, others.reduce((n, l) => n + l.quantity, 0) + dto.quantity);
    await item.update({ quantity: dto.quantity });
    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.findItem(userId, itemId);
    await item.destroy();
    return this.getCart(userId);
  }

  async clear(userId: number) {
    const cart = await this.ensureCart(userId);
    await this.items.destroy({ where: { cartId: cart.id } });
  }

  private async ensureCart(userId: number) {
    const [cart] = await this.carts.findOrCreate({ where: { userId } });
    return cart;
  }

  private productLines(cartId: number, productId: number, transaction?: Transaction) {
    return this.items.findAll({
      where: { cartId, productId },
      include: [{ model: ProductOption, attributes: ['id'], through: { attributes: [] } }],
      transaction,
    });
  }

  /** The store whose dishes the cart holds, or null when it is empty. */
  private async cartStore(cartId: number, transaction: Transaction) {
    const line = await this.items.findOne({
      where: { cartId },
      include: [
        {
          model: Product,
          attributes: ['id', 'storeId'],
          paranoid: false,
          include: [{ model: Store, attributes: ['id', 'name'], paranoid: false }],
        },
      ],
      transaction,
    });
    const store = line?.product?.store;
    return store ? { id: store.id, name: store.name } : null;
  }

  private async findItem(userId: number, itemId: number) {
    const item = await this.items.findOne({
      where: { id: itemId },
      include: [{ model: Cart, where: { userId }, attributes: [] }],
    });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }

  private async purchasableProduct(productId: number) {
    const product = await this.products.findByPk(productId, {
      include: [Store, { model: OptionGroup, include: [ProductOption] }],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'active' || product.store?.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }
    return product;
  }

  private assertStock(product: Product, quantity: number) {
    if (product.stock < quantity) {
      throw new BadRequestException(`Only ${product.stock} "${product.name}" left in stock`);
    }
  }
}
