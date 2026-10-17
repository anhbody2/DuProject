import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Address } from '../../database/models';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address) private readonly addresses: typeof Address,
    private readonly sequelize: Sequelize,
  ) {}

  findAll(userId: number) {
    return this.addresses.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['id', 'DESC'],
      ],
    });
  }

  async findOne(userId: number, id: number) {
    const address = await this.addresses.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  create(userId: number, dto: CreateAddressDto) {
    return this.sequelize.transaction(async (transaction) => {
      // The first address automatically becomes the default one.
      const count = await this.addresses.count({ where: { userId }, transaction });
      const isDefault = dto.isDefault || count === 0;
      if (isDefault) await this.clearDefault(userId, transaction);
      return this.addresses.create({ ...dto, userId, isDefault }, { transaction });
    });
  }

  update(userId: number, id: number, dto: UpdateAddressDto) {
    return this.sequelize.transaction(async (transaction) => {
      const address = await this.findOne(userId, id);
      if (dto.isDefault) await this.clearDefault(userId, transaction, id);
      return address.update(dto, { transaction });
    });
  }

  setDefault(userId: number, id: number) {
    return this.update(userId, id, { isDefault: true });
  }

  /** Placed orders keep their own snapshot (orders.delivery_address), so deleting is always safe. */
  remove(userId: number, id: number) {
    return this.sequelize.transaction(async (transaction) => {
      const address = await this.findOne(userId, id);
      await address.destroy({ transaction });
      if (!address.isDefault) return;
      // Keep one default while any address is left: the newest one takes over.
      const next = await this.addresses.findOne({ where: { userId }, order: [['id', 'DESC']], transaction });
      await next?.update({ isDefault: true }, { transaction });
    });
  }

  private clearDefault(userId: number, transaction: Transaction, exceptId?: number) {
    return this.addresses.update(
      { isDefault: false },
      {
        where: { userId, isDefault: true, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) },
        transaction,
      },
    );
  }
}
