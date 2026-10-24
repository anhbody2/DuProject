import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import type { Request } from 'express';
import { User } from '../../database/models';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser, JwtPayload } from '../types/auth-user';

/**
 * Global guard (APP_GUARD): every HTTP route requires `Authorization: Bearer <jwt>`
 * unless marked @Public(). Re-loads the user so that suspended/deleted accounts are
 * rejected immediately, and attaches `req.user`.
 *
 * On @Public() routes a valid token still sets `req.user` (optional auth), but a
 * missing, expired or rejected one is ignored, so clients holding a stale token can
 * keep browsing without being logged out by a 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectModel(User) private readonly users: typeof User,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // The chat gateway authenticates in its own handshake middleware.
    if (ctx.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<Request>();

    if (isPublic) {
      req.user = await this.authenticate(req).catch(() => undefined);
      return true;
    }
    req.user = await this.authenticate(req);
    return true;
  }

  private async authenticate(req: Request): Promise<AuthUser> {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.users.findByPk(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (user.status !== 'active') throw new ForbiddenException(`Account is ${user.status}`);

    return { id: user.id, username: user.username, email: user.email, role: user.role };
  }
}
