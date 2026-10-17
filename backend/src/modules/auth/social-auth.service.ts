import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type { SocialProvider } from '../../database/models';

const FB_GRAPH = 'https://graph.facebook.com/v21.0';

/** A provider identity whose token has been verified server-side. */
export interface SocialIdentity {
  provider: SocialProvider;
  providerUserId: string;
  /** Null when the provider shares no email (e.g. a phone-only Facebook account). */
  email: string | null;
  /** Only verified emails may be used to link to an existing account. */
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Verifies tokens obtained by the browser from Google / Facebook. The browser never
 * sends us an email or user id directly: we only trust what the provider confirms.
 */
@Injectable()
export class SocialAuthService {
  private readonly googleClientId?: string;
  private readonly facebookAppId?: string;
  private readonly facebookAppSecret?: string;
  private readonly google = new OAuth2Client();

  constructor(config: ConfigService) {
    this.googleClientId = config.get<string>('GOOGLE_CLIENT_ID') || undefined;
    this.facebookAppId = config.get<string>('FACEBOOK_APP_ID') || undefined;
    this.facebookAppSecret = config.get<string>('FACEBOOK_APP_SECRET') || undefined;
  }

  /** Public ids the frontend needs to load the provider SDKs; null = provider disabled. */
  config() {
    return {
      google: this.googleClientId ?? null,
      facebook: this.facebookAppId && this.facebookAppSecret ? this.facebookAppId : null,
    };
  }

  async verifyGoogle(idToken: string): Promise<SocialIdentity> {
    if (!this.googleClientId) throw new BadRequestException('Google login is not enabled');

    // Checks Google's signature, expiry, issuer, and that the token was issued to our client id.
    const payload = await this.google
      .verifyIdToken({ idToken, audience: this.googleClientId })
      .then((ticket) => ticket.getPayload())
      .catch(() => undefined);
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google token');

    return {
      provider: 'google',
      providerUserId: payload.sub,
      email: payload.email?.toLowerCase() ?? null,
      emailVerified: payload.email_verified === true,
      firstName: payload.given_name,
      lastName: payload.family_name,
      avatarUrl: payload.picture,
    };
  }

  async verifyFacebook(accessToken: string): Promise<SocialIdentity> {
    const appId = this.facebookAppId;
    const secret = this.facebookAppSecret;
    if (!appId || !secret) throw new BadRequestException('Facebook login is not enabled');

    // A user token issued to another app would pass /me, so first check it belongs to ours.
    const debug = await this.graph<{ data?: { is_valid?: boolean; app_id?: string; user_id?: string } }>(
      `${FB_GRAPH}/debug_token?${new URLSearchParams({ input_token: accessToken, access_token: `${appId}|${secret}` })}`,
    );
    const info = debug?.data;
    if (!info?.is_valid || info.app_id !== appId || !info.user_id) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const me = await this.graph<{ id?: string; email?: string; first_name?: string; last_name?: string }>(
      `${FB_GRAPH}/me?${new URLSearchParams({
        fields: 'id,email,first_name,last_name',
        access_token: accessToken,
        appsecret_proof: createHmac('sha256', secret).update(accessToken).digest('hex'),
      })}`,
    );
    if (!me?.id || me.id !== info.user_id) throw new UnauthorizedException('Invalid Facebook token');

    return {
      provider: 'facebook',
      providerUserId: me.id,
      email: me.email?.toLowerCase() ?? null,
      // Facebook only returns emails the user has confirmed.
      emailVerified: !!me.email,
      firstName: me.first_name,
      lastName: me.last_name,
    };
  }

  /** GET a Graph API URL. Graph errors (bad token) come back as null; network failures as 502. */
  private async graph<T>(url: string): Promise<T | null> {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch(() => {
      throw new BadGatewayException('Could not reach Facebook');
    });
    if (res.status >= 500) throw new BadGatewayException('Could not reach Facebook');
    return res.ok ? ((await res.json()) as T) : null;
  }
}
