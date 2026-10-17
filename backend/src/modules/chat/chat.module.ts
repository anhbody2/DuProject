import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatEvents } from './chat.events';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatEvents, ChatGateway],
})
export class ChatModule {}
