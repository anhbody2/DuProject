import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '../../database/models';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Global guard (APP_GUARD, registered after JwtAuthGuard): enforces @Roles(...).
 * Routes without @Roles() pass. Per-store roles are not global roles; services check
 * those with StoreAccessService.assert().
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (ctx.getType() !== 'http') return true;

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;

    const { user } = ctx.switchToHttp().getRequest<Request>();
    if (!user) throw new UnauthorizedException('Authentication required');
    if (!roles.includes(user.role)) {
      throw new ForbiddenException(`Requires role: ${roles.join(' or ')}`);
    }
    return true;
  }
}
