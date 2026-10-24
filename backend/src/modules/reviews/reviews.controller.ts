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
import { CreateReplyDto, CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // ---- store reviews
  @Public()
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
  @Public()
  @Get('products/:id/reviews')
  listForProduct(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationQueryDto) {
    return this.reviews.listForProduct(id, query);
  }

  @Get('products/:id/reviews/mine')
  mineForProduct(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.mineForProduct(user, id);
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

  // ---- replies to product reviews
  @Post('product-reviews/:id/replies')
  replyToProductReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplyDto,
  ) {
    return this.reviews.reply(user, id, dto);
  }

  @Delete('product-review-replies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProductReviewReply(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.removeReply(user, id);
  }
}
