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

/** Refresh tokens are signed with JWT_REFRESH_SECRET, so they never pass as access tokens. */
export interface RefreshPayload {
  sub: number;
  typ: 'refresh';
  /** Random id, so two tokens issued in the same second still differ. */
  jti: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
