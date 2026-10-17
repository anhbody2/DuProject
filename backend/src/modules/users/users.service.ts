import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
import { Op, WhereOptions } from 'sequelize';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../../common/utils/uploads';
import { Profile, Store, StoreMember, User } from '../../database/models';
import { TokenService } from '../auth/token.service';
import {
  AdminUpdateUserDto,
  ChangePasswordDto,
  ListUsersQueryDto,
  UpdateProfileDto,
} from './dto/users.dto';

export const AVATAR_DIR = join(UPLOAD_DIR, 'avatars');
const AVATAR_URL_PREFIX = `${UPLOAD_URL_PREFIX}avatars/`;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(Profile) private readonly profiles: typeof Profile,
    @InjectModel(StoreMember) private readonly members: typeof StoreMember,
    private readonly tokens: TokenService,
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

  /** Points the profile at an uploaded avatar file (or clears it) and deletes the previous upload. */
  async setAvatar(userId: number, filename: string | null) {
    const [profile] = await this.profiles.findOrCreate({ where: { userId } });
    const previous = profile.avatarUrl;
    await profile.update({ avatarUrl: filename ? AVATAR_URL_PREFIX + filename : null });
    if (previous?.startsWith(AVATAR_URL_PREFIX)) {
      // Best effort: a missing file must not fail the request.
      await unlink(join(AVATAR_DIR, basename(previous))).catch(() => undefined);
    }
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
    // A new pair replaces the stored refresh token: other devices are signed out, this one stays in.
    return { message: 'Password updated', ...(await this.tokens.issue(user.id, user.role)) };
  }

  /** Stores the user owns or works at, with their store-level role. */
  async myStores(userId: number) {
    const memberships = await this.members.findAll({
      where: { userId },
      // required: memberships of deleted stores drop out.
      include: [{ model: Store, required: true }],
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
    if (user.status !== 'active') await this.tokens.revokeUser(user.id);
    return user;
  }

  /** Fails with 409 if the user still owns stores or has orders (FK RESTRICT). */
  async remove(id: number) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
