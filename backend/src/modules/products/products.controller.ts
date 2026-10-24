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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import {
  CreateProductDto,
  ListProductsQueryDto,
  OptionDto,
  OptionGroupDto,
  ProductImageDto,
  UpdateOptionDto,
  UpdateOptionGroupDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ---- public
  @Public()
  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.products.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findPublic(id);
  }

  // ---- store owner / manager (checked per store in the service)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.products.remove(user, id);
  }

  // ---- images
  @Post(':id/images')
  addImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductImageDto,
  ) {
    return this.products.addImage(user, id, dto);
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.products.updateImage(user, id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.products.removeImage(user, id, imageId);
  }

  // ---- option groups
  @Post(':id/option-groups')
  addOptionGroup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OptionGroupDto,
  ) {
    return this.products.addOptionGroup(user, id, dto);
  }

  @Patch(':id/option-groups/:groupId')
  updateOptionGroup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateOptionGroupDto,
  ) {
    return this.products.updateOptionGroup(user, id, groupId, dto);
  }

  @Delete(':id/option-groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOptionGroup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.products.removeOptionGroup(user, id, groupId);
  }

  // ---- options
  @Post(':id/option-groups/:groupId/options')
  addOption(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: OptionDto,
  ) {
    return this.products.addOption(user, id, groupId, dto);
  }

  @Patch(':id/option-groups/:groupId/options/:optionId')
  updateOption(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.products.updateOption(user, id, groupId, optionId, dto);
  }

  @Delete(':id/option-groups/:groupId/options/:optionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOption(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
  ) {
    return this.products.removeOption(user, id, groupId, optionId);
  }
}
