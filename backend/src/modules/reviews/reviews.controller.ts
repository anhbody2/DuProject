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
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // ---- store reviews
  @Get('stores/:id/reviews')
  listForStore(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationQueryDto) {
    return this.reviews.listForStore(id, query);
  }

  @Post('stores/:id/reviews')
  createForStore(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.createForStore(user, id, dto);
  }

  @Patch('store-reviews/:id')
  updateStoreReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update('store', user, id, dto);
  }

  @Delete('store-reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStoreReview(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove('store', user, id);
  }

  // ---- product reviews
  @Get('products/:id/reviews')
  listForProduct(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationQueryDto) {
    return this.reviews.listForProduct(id, query);
  }

  @Post('products/:id/reviews')
  createForProduct(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.createForProduct(user, id, dto);
  }

  @Patch('product-reviews/:id')
  updateProductReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update('product', user, id, dto);
  }

  @Delete('product-reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProductReview(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove('product', user, id);
  }
}
