import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fromCents, toCents } from '../../common/utils/money';
import { Cart, CartItem, Product, ProductImage, Store } from '../../database/models';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart) private readonly carts: typeof Cart,
    @InjectModel(CartItem) private readonly items: typeof CartItem,
    @InjectModel(Product) private readonly products: typeof Product,
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
            { model: Store, attributes: ['id', 'name', 'slug', 'status'] },
            { model: ProductImage, where: { isPrimary: true }, required: false, attributes: ['imageUrl'] },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    let subtotal = 0;
    const lines = items.map((item) => {
      const p = item.product!;
      const unitPrice = toCents(p.salePrice ?? p.price);
      const lineTotal = unitPrice * item.quantity;
      const available = p.status === 'active' && p.store?.status === 'active' && p.stock >= item.quantity;
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
      items: lines,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: fromCents(subtotal),
    };
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const cart = await this.ensureCart(userId);
    const product = await this.purchasableProduct(dto.productId);
    const existing = await this.items.findOne({ where: { cartId: cart.id, productId: dto.productId } });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    this.assertStock(product, quantity);

    if (existing) await existing.update({ quantity });
    else await this.items.create({ cartId: cart.id, productId: dto.productId, quantity });
    return this.getCart(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.findItem(userId, itemId);
    const product = await this.purchasableProduct(item.productId);
    this.assertStock(product, dto.quantity);
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

  private async findItem(userId: number, itemId: number) {
    const item = await this.items.findOne({
      where: { id: itemId },
      include: [{ model: Cart, where: { userId }, attributes: [] }],
    });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }

  private async purchasableProduct(productId: number) {
    const product = await this.products.findByPk(productId, { include: [Store] });
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
