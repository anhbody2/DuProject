import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import type { NextFunction, Request, Response } from 'express';
import { User } from '../../database/models';
import type { JwtPayload } from '../types/auth-user';

/**
 * Verifies the `Authorization: Bearer <jwt>` header, re-loads the user so that
 * suspended/deleted accounts are rejected immediately, and attaches `req.user`.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User) private readonly users: typeof User,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
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

    req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    next();
  }
}
