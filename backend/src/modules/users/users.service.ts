import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { Op, WhereOptions } from 'sequelize';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import { Profile, Store, StoreMember, User } from '../../database/models';
import {
  AdminUpdateUserDto,
  ChangePasswordDto,
  ListUsersQueryDto,
  UpdateProfileDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(Profile) private readonly profiles: typeof Profile,
    @InjectModel(StoreMember) private readonly members: typeof StoreMember,
  ) {}

  // ---------------------------------------------------------------- self

  async getMe(userId: number) {
    return this.findOne(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const [profile] = await this.profiles.findOrCreate({ where: { userId } });
    await profile.update(dto);
    return this.findOne(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.users.scope('withPassword').findByPk(userId);
    if (!user || !(await compare(dto.currentPassword, user.passwordHash))) {
      // 400, not 401: clients treat 401 as an expired session and log the user out.
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from the current one');
    }
    await user.update({ passwordHash: await hash(dto.newPassword, 10) });
    return { message: 'Password updated' };
  }

  /** Stores the user owns or works at, with their store-level role. */
  async myStores(userId: number) {
    const memberships = await this.members.findAll({
      where: { userId },
      include: [Store],
      order: [['createdAt', 'DESC']],
    });
    return memberships.map((m) => ({ role: m.role, store: m.store }));
  }

  // ---------------------------------------------------------------- admin

  async findAll(query: ListUsersQueryDto) {
    const where: WhereOptions<User> = {};
    if (query.role) Object.assign(where, { role: query.role });
    if (query.status) Object.assign(where, { status: query.status });
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query.q}%` } },
          { email: { [Op.iLike]: `%${query.q}%` } },
        ],
      });
    }
    const { rows, count } = await this.users.findAndCountAll({
      where,
      include: [Profile],
      order: [['id', 'DESC']],
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  async findOne(id: number) {
    const user = await this.users.findByPk(id, { include: [Profile] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async adminUpdate(id: number, dto: AdminUpdateUserDto) {
    const user = await this.findOne(id);
    await user.update(dto);
    return user;
  }

  /** Fails with 409 if the user still owns stores or has orders (FK RESTRICT). */
  async remove(id: number) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
