import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../database/models';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or a whole controller) to the given global roles; checked by RolesGuard.
 * A handler-level @Roles() overrides the controller-level one.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
