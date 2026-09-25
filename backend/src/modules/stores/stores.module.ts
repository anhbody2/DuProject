import { Module } from '@nestjs/common';
import { StoreAccessService } from './store-access.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  controllers: [StoresController],
  providers: [StoresService, StoreAccessService],
  exports: [StoreAccessService],
})
export class StoresModule {}
