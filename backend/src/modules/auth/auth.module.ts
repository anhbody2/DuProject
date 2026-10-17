import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { SocialAuthService } from './social-auth.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService, SocialAuthService, TokenService],
  exports: [TokenService],
})
export class AuthModule {}
