import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { Op, Transaction, col, fn, where } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PasswordReset, Profile, SocialAccount, User } from '../../database/models';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './dto/auth.dto';
import { MailService } from './mail.service';
import type { SocialIdentity } from './social-auth.service';
import { TokenService } from './token.service';

const RESET_CODE_TTL_MIN = 10;
const RESET_MAX_ATTEMPTS = 5;
/** Minimum gap between two codes for the same user, so the endpoint can't be used to spam an inbox. */
const RESET_RESEND_COOLDOWN_MS = 60_000;

/**
 * Usernames are unique regardless of case ("Admin" and "admin" are the same account):
 * enforced by the users_username_lower_key index, and used for login lookups.
 */
const sameUsername = (username: string) => where(fn('lower', col('username')), username.toLowerCase());

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(Profile) private readonly profiles: typeof Profile,
    @InjectModel(PasswordReset) private readonly resets: typeof PasswordReset,
    @InjectModel(SocialAccount) private readonly socials: typeof SocialAccount,
    private readonly sequelize: Sequelize,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.users.findOne({
      where: { [Op.or]: [{ email }, sameUsername(dto.username)] },
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
      where: { [Op.or]: [{ email: dto.login.toLowerCase() }, sameUsername(dto.login)] },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'active') throw new ForbiddenException(`Account is ${user.status}`);

    return this.issueToken(user.id);
  }

  // ---------------------------------------------------------- social login

  /**
   * Logs in with an identity already verified by SocialAuthService. Resolution order:
   * 1. the identity is linked to a user -> that user;
   * 2. a user has the same (provider-verified) email -> link the identity to them;
   * 3. otherwise create a customer account with an unusable random password.
   */
  async socialLogin(identity: SocialIdentity) {
    const { provider, providerUserId, email } = identity;
    const userId = await this.sequelize.transaction(async (transaction) => {
      const linked = await this.socials.findOne({ where: { provider, providerUserId }, transaction });
      if (linked) return linked.userId;

      if (!email) {
        throw new BadRequestException(`Your ${provider} account has no email; please register with email instead`);
      }
      // Linking by an unverified email would let anyone claim someone else's account.
      if (!identity.emailVerified) throw new BadRequestException(`Your ${provider} email is not verified`);

      let user = await this.users.findOne({ where: { email }, transaction });
      if (!user) {
        user = await this.users.create(
          {
            username: await this.freeUsername(email, transaction),
            email,
            // Nobody knows this password; the user can set a real one via forgot-password.
            passwordHash: await hash(randomBytes(32).toString('hex'), 10),
            role: 'customer',
          },
          { transaction },
        );
        await this.profiles.create(
          {
            userId: user.id,
            firstName: identity.firstName,
            lastName: identity.lastName,
            avatarUrl: identity.avatarUrl,
          },
          { transaction },
        );
      }
      await this.socials.create({ userId: user.id, provider, providerUserId }, { transaction });
      return user.id;
    });

    const user = await this.users.findByPk(userId);
    if (user!.status !== 'active') throw new ForbiddenException(`Account is ${user!.status}`);
    return this.issueToken(userId);
  }

  /** "Minh.Anh+food@gmail.com" -> "Minh.Anh", or "Minh.Anh4821" if that is taken. */
  private async freeUsername(email: string, transaction: Transaction) {
    let base = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 40);
    if (base.length < 3) base = `user${base}`;
    for (let candidate = base, i = 0; i < 10; i++, candidate = `${base}${randomInt(1000, 100_000)}`) {
      if (!(await this.users.count({ where: sameUsername(candidate), transaction }))) return candidate;
    }
    return `${base}${Date.now()}`;
  }

  // ------------------------------------------------------- forgot password

  async forgotPassword(dto: ForgotPasswordDto) {
    const message = 'If that email is registered, a reset code has been sent';
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user || user.status !== 'active') return { message };

    const previous = await this.resets.findOne({ where: { userId: user.id } });
    if (previous && Date.now() - previous.createdAt.getTime() < RESET_RESEND_COOLDOWN_MS) {
      return { message };
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.sequelize.transaction(async (transaction) => {
      await this.resets.destroy({ where: { userId: user.id }, transaction });
      await this.resets.create(
        {
          userId: user.id,
          codeHash: await hash(code, 10),
          expiresAt: new Date(Date.now() + RESET_CODE_TTL_MIN * 60_000),
        },
        { transaction },
      );
    });

    await this.mail.send(
      user.email,
      'Mã đặt lại mật khẩu',
      `Mã đặt lại mật khẩu của bạn là ${code}. Mã có hiệu lực trong ${RESET_CODE_TTL_MIN} phút.
` +
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
      `<p>Mã đặt lại mật khẩu của bạn là:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>` +
        `<p>Mã có hiệu lực trong ${RESET_CODE_TTL_MIN} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    );
    return { message };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    await this.checkResetCode(dto);
    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.checkResetCode(dto);
    await this.sequelize.transaction(async (transaction) => {
      await this.users.update(
        { passwordHash: await hash(dto.newPassword, 10) },
        { where: { id: reset.userId }, transaction },
      );
      await reset.destroy({ transaction });
    });
    return this.issueToken(reset.userId);
  }

  /** Returns the pending reset if the code matches; counts wrong guesses. */
  private async checkResetCode({ email, code }: VerifyResetCodeDto) {
    // 400, not 401: clients treat 401 as an expired session and log the user out.
    const invalid = new BadRequestException('Invalid or expired code');
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user || user.status !== 'active') throw invalid;

    const reset = await this.resets.findOne({ where: { userId: user.id } });
    if (!reset || reset.expiresAt.getTime() < Date.now() || reset.attempts >= RESET_MAX_ATTEMPTS) {
      throw invalid;
    }
    if (!(await compare(code, reset.codeHash))) {
      await reset.increment('attempts');
      throw invalid;
    }
    return reset;
  }

  // ------------------------------------------------------------- sessions

  /** Public. Rotates the refresh token: the old one stops working. */
  async refresh(dto: RefreshTokenDto) {
    const { userId, ...pair } = await this.tokens.rotate(dto.refreshToken);
    return { ...pair, user: await this.users.findByPk(userId, { include: [Profile] }) };
  }

  /** Public, so it also works once the access token has expired. Always succeeds. */
  async logout(dto: RefreshTokenDto) {
    await this.tokens.revokeToken(dto.refreshToken);
    return { message: 'Logged out' };
  }

  me(userId: number) {
    return this.users.findByPk(userId, { include: [Profile] });
  }

  private async issueToken(userId: number) {
    const user = await this.users.findByPk(userId, { include: [Profile] });
    return { ...(await this.tokens.issue(user!.id, user!.role)), user };
  }
}
