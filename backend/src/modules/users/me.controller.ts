import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { imageUploadOptions } from '../../common/utils/uploads';
import { ChangePasswordDto, UpdateProfileDto } from './dto/users.dto';
import { AVATAR_DIR, UsersService } from './users.service';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Endpoints about the currently authenticated user. */
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  /** multipart/form-data, field `file`: JPEG, PNG or WebP up to 2 MB. Replaces the current avatar. */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', imageUploadOptions(AVATAR_DIR, AVATAR_MAX_BYTES, 'Avatar')),
  )
  uploadAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    return this.users.setAvatar(user.id, file.filename);
  }

  @Delete('avatar')
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.users.setAvatar(user.id, null);
  }

  @Get('stores')
  myStores(@CurrentUser() user: AuthUser) {
    return this.users.myStores(user.id);
  }
}
