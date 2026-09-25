import type { UserRole } from '../../database/models';

/** The authenticated user attached to `req.user` by AuthMiddleware. */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: number;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
