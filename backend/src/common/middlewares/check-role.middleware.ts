import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  Type,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../database/models';

/**
 * Middleware factory: `consumer.apply(CheckRole('admin')).forRoutes(...)`.
 * Must be applied after AuthMiddleware so `req.user` is populated.
 */
export function CheckRole(...roles: UserRole[]): Type<NestMiddleware> {
  @Injectable()
  class CheckRoleMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
      if (!req.user) throw new UnauthorizedException('Authentication required');
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenException(`Requires role: ${roles.join(' or ')}`);
      }
      next();
    }
  }
  return mixin(CheckRoleMiddleware);
}
