import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  Length,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/strong-password.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.]+$/, { message: 'username may only contain letters, numbers, _ and .' })
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsStrongPassword()
  password: string;

  /** Self-registration may only choose customer or store_owner. */
  @IsOptional()
  @IsIn(['customer', 'store_owner'])
  role?: 'customer' | 'store_owner';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class LoginDto {
  /** Username or email. */
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  /** The refreshToken returned by login / register / refresh. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  refreshToken: string;
}

export class GoogleLoginDto {
  /** The ID token (credential) returned by Google Identity Services. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  idToken: string;
}

export class FacebookLoginDto {
  /** The user access token returned by the Facebook JS SDK. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  accessToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}

export class VerifyResetCodeDto extends ForgotPasswordDto {
  /** The 6-digit code emailed by POST /auth/forgot-password. */
  @IsNumberString({ no_symbols: true })
  @Length(6, 6)
  code: string;
}

export class ResetPasswordDto extends VerifyResetCodeDto {
  @IsStrongPassword()
  newPassword: string;
}
