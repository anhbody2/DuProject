import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or a whole controller) out of the global JwtAuthGuard.
 * A valid bearer token still sets `req.user`; a missing or bad one is ignored.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
