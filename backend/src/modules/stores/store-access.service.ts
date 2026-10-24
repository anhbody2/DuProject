import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import type { AuthUser } from '../../common/types/auth-user';
import { Store, StoreMember, StoreMemberRole } from '../../database/models';

export const MANAGERS: StoreMemberRole[] = ['owner', 'manager'];
export const ALL_MEMBERS: StoreMemberRole[] = ['owner', 'manager', 'staff'];

/**
 * Store-level authorization (who may manage a specific store). Global roles are
 * handled by RolesGuard (@Roles); this covers per-store membership.
 */
@Injectable()
export class StoreAccessService {
  constructor(
    @InjectModel(Store) private readonly stores: typeof Store,
    @InjectModel(StoreMember) private readonly members: typeof StoreMember,
  ) {}

  async assert(
    user: AuthUser,
    storeId: number,
    roles: StoreMemberRole[] = MANAGERS,
    transaction?: Transaction,
  ): Promise<Store> {
    const store = await this.stores.findByPk(storeId, { transaction });
    if (!store) throw new NotFoundException('Store not found');
    if (user.role === 'admin' || (roles.includes('owner') && store.ownerId === user.id)) {
      return store;
    }
    const member = await this.members.findOne({
      where: { storeId, userId: user.id, role: roles },
      transaction,
    });
    if (!member) throw new ForbiddenException('You do not have access to this store');
    return store;
  }
}
