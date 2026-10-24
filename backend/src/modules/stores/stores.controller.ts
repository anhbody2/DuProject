import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { StatsQueryDto } from '../admin/dto/admin.dto';
import {
  AddStoreMemberDto,
  CreateStoreDto,
  ListStoresQueryDto,
  SetStoreCategoriesDto,
  StoreLocationDto,
  UpdateStoreDto,
  UpdateStoreLocationDto,
  UpdateStoreMemberDto,
  UpdateStoreStatusDto,
} from './dto/store.dto';
import { StoresService } from './stores.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  // ---- public
  @Public()
  @Get()
  findAll(@Query() query: ListStoresQueryDto) {
    return this.stores.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stores.findPublic(id);
  }

  @Public()
  @Get(':id/locations')
  findLocations(@Param('id', ParseIntPipe) id: number) {
    return this.stores.findLocations(id);
  }

  // ---- any signed-in user; customers are promoted to 'member'
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStoreDto) {
    return this.stores.create(user, dto);
  }

  // ---- store members (checked per store in the service)
  @Get(':id/manage')
  findForManager(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.stores.findForManager(user, id);
  }

  @Get(':id/stats')
  stats(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StatsQueryDto,
  ) {
    return this.stores.stats(user, id, query.days);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.stores.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.stores.remove(user, id);
  }

  @Put(':id/categories')
  setCategories(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetStoreCategoriesDto,
  ) {
    return this.stores.setCategories(user, id, dto.categoryIds);
  }

  // ---- admin
  @Roles('admin')
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreStatusDto) {
    return this.stores.updateStatus(id, dto);
  }

  // ---- locations
  @Post(':id/locations')
  addLocation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StoreLocationDto,
  ) {
    return this.stores.addLocation(user, id, dto);
  }

  @Patch(':id/locations/:locationId')
  updateLocation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdateStoreLocationDto,
  ) {
    return this.stores.updateLocation(user, id, locationId, dto);
  }

  @Delete(':id/locations/:locationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLocation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.stores.removeLocation(user, id, locationId);
  }

  // ---- members
  @Get(':id/members')
  findMembers(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.stores.findMembers(user, id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddStoreMemberDto,
  ) {
    return this.stores.addMember(user, id, dto);
  }

  @Patch(':id/members/:memberId')
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateStoreMemberDto,
  ) {
    return this.stores.updateMember(user, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.stores.removeMember(user, id, memberId);
  }
}
