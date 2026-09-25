import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Profile, User } from '../../database/models';
import type { JwtPayload } from '../../common/types/auth-user';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(Profile) private readonly profiles: typeof Profile,
    private readonly sequelize: Sequelize,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.users.findOne({
      where: { [Op.or]: [{ email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException(
        existing.email === email ? 'Email already registered' : 'Username already taken',
      );
    }

    const user = await this.sequelize.transaction(async (transaction) => {
      const created = await this.users.create(
        {
          username: dto.username,
          email,
          passwordHash: await hash(dto.password, 10),
          role: dto.role ?? 'customer',
        },
        { transaction },
      );
      await this.profiles.create(
        {
          userId: created.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
        { transaction },
      );
      return created;
    });

    return this.issueToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.users.scope('withPassword').findOne({
      where: { [Op.or]: [{ email: dto.login.toLowerCase() }, { username: dto.login }] },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'active') throw new ForbiddenException(`Account is ${user.status}`);

    return this.issueToken(user.id);
  }

  me(userId: number) {
    return this.users.findByPk(userId, { include: [Profile] });
  }

  private async issueToken(userId: number) {
    const user = await this.users.findByPk(userId, { include: [Profile] });
    const payload: JwtPayload = { sub: user!.id, role: user!.role };
    return { accessToken: await this.jwt.signAsync(payload), user };
  }
}
