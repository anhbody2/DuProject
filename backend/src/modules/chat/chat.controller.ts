import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { ChatService } from './chat.service';
import { MessagesQueryDto, OpenDirectDto, SearchUsersQueryDto, SendMessageDto } from './dto/chat.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  listMine(@CurrentUser() user: AuthUser) {
    return this.chat.listMine(user);
  }

  @Get('conversations/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.chat.findOne(user, id);
  }

  @Post('conversations/direct')
  openDirect(@CurrentUser() user: AuthUser, @Body() dto: OpenDirectDto) {
    return this.chat.openDirect(user, dto.userId);
  }

  @Post('conversations/store/:storeId')
  openStore(@CurrentUser() user: AuthUser, @Param('storeId', ParseIntPipe) storeId: number) {
    return this.chat.openStore(user, storeId);
  }

  @Post('conversations/support')
  openSupport(@CurrentUser() user: AuthUser) {
    return this.chat.openSupport(user);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chat.listMessages(user, id, query);
  }

  @Post('conversations/:id/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.send(user, id, dto.body);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.chat.markRead(user, id);
  }

  @Get('unread')
  unread(@CurrentUser() user: AuthUser) {
    return this.chat.unreadCount(user);
  }

  @Get('users')
  searchUsers(@CurrentUser() user: AuthUser, @Query() { q }: SearchUsersQueryDto) {
    return this.chat.searchUsers(user, q);
  }

  /** Admin inbox of support threads (@Roles('admin')). */
  @Roles('admin')
  @Get('support')
  listSupport(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.chat.listSupport(user, query);
  }

  /** Admin: contact a user first through their support thread. */
  @Roles('admin')
  @Post('support/:userId')
  openSupportFor(@CurrentUser() user: AuthUser, @Param('userId', ParseIntPipe) userId: number) {
    return this.chat.openSupportFor(user, userId);
  }
}
