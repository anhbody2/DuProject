import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import {
  FacebookLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly social: SocialAuthService,
  ) {}

  /** Public */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /** Public */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Public. Which social logins are enabled, with the public ids the frontend SDKs need. */
  @Get('social/config')
  socialConfig() {
    return this.social.config();
  }

  /** Public. Exchanges a Google ID token for our own token; creates the account on first use. */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleLoginDto) {
    return this.auth.socialLogin(await this.social.verifyGoogle(dto.idToken));
  }

  /** Public. Same as auth/google, with a Facebook user access token. */
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  async facebook(@Body() dto: FacebookLoginDto) {
    return this.auth.socialLogin(await this.social.verifyFacebook(dto.accessToken));
  }

  /** Public. Always 200 so the response does not reveal which emails are registered. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  /** Public. Checks the emailed code without using it up. */
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.auth.verifyResetCode(dto);
  }

  /** Public. Sets the new password and logs the user in. */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  /** Public. `{ refreshToken }` -> new `{ accessToken, refreshToken, user }`; 401 if reused, revoked or expired. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }

  /** Public. Revokes the refresh token; the access token simply expires. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
