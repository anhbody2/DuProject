import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { createHash, randomUUID } from 'crypto';
import { Transaction } from 'sequelize';
import { User, UserRole } from '../../database/models';
import type { JwtPayload, RefreshPayload } from '../../common/types/auth-user';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * Access + refresh tokens.
 * - Access token: short-lived JWT (JWT_SECRET / JWT_EXPIRES_IN), checked by AuthMiddleware.
 * - Refresh token: long-lived JWT (JWT_REFRESH_SECRET / JWT_REFRESH_EXPIRES_IN). Only its
 *   SHA-256 is kept in users.refresh_token_hash, one per user: issuing a new pair (login,
 *   refresh, password change/reset) replaces it, so the previous refresh token stops working.
 */
@Injectable()
export class TokenService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
    @InjectModel(User) private readonly users: typeof User,
  ) {
    // Falls back to a secret derived from JWT_SECRET, which still differs from it,
    // so a refresh token is never accepted as an access token.
    this.refreshSecret =
      config.get<string>('JWT_REFRESH_SECRET') || `${config.getOrThrow<string>('JWT_SECRET')}:refresh`;
    this.refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d') as JwtSignOptions['expiresIn'];
  }

  /** Signs a new pair and makes its refresh token the user's only valid one. */
  async issue(userId: number, role: UserRole, transaction?: Transaction): Promise<TokenPair> {
    const pair = await this.sign(userId, role);
    await this.users.update(
      { refreshTokenHash: sha256(pair.refreshToken) },
      { where: { id: userId }, transaction },
    );
    return pair;
  }

  /**
   * Exchanges a refresh token for a new pair (rotation). The swap is a conditional
   * UPDATE on the stored hash, so a token can be used once: a replayed or superseded
   * token, or two concurrent refreshes with the same token, get 401 for all but one.
   */
  async rotate(refreshToken: string): Promise<{ userId: number } & TokenPair> {
    const invalid = new UnauthorizedException('Invalid or expired refresh token');
    const payload = await this.verify(refreshToken);
    if (!payload) throw invalid;

    const user = await this.users.findByPk(payload.sub);
    if (!user) throw invalid;
    if (user.status !== 'active') throw new ForbiddenException(`Account is ${user.status}`);

    const pair = await this.sign(user.id, user.role);
    const [updated] = await this.users.update(
      { refreshTokenHash: sha256(pair.refreshToken) },
      { where: { id: user.id, refreshTokenHash: sha256(refreshToken) } },
    );
    if (!updated) throw invalid;
    return { userId: user.id, ...pair };
  }

  /** Logout: clears the refresh session if the token is the current one. Expired tokens are accepted. */
  async revokeToken(refreshToken: string) {
    const payload = await this.verify(refreshToken, true);
    if (!payload) return;
    await this.users.update(
      { refreshTokenHash: null },
      { where: { id: payload.sub, refreshTokenHash: sha256(refreshToken) } },
    );
  }

  /** Ends the user's refresh session whatever token it has (e.g. an admin suspends the account). */
  async revokeUser(userId: number, transaction?: Transaction) {
    await this.users.update({ refreshTokenHash: null }, { where: { id: userId }, transaction });
  }

  private async sign(userId: number, role: UserRole): Promise<TokenPair> {
    const access: JwtPayload = { sub: userId, role };
    const refresh: RefreshPayload = { sub: userId, typ: 'refresh', jti: randomUUID() };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access),
      this.jwt.signAsync(refresh, { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn }),
    ]);
    return { accessToken, refreshToken };
  }

  private async verify(token: string, ignoreExpiration = false): Promise<RefreshPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.refreshSecret,
        ignoreExpiration,
      });
      return payload.typ === 'refresh' ? payload : null;
    } catch {
      return null;
    }
  }
}
