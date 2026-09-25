import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../../../database/models';
import type {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../database/models';

export class CheckoutItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  /** Selected option ids (validated against the product's option groups). */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  optionIds?: number[];
}

export class CreateOrderDto {
  @IsInt()
  deliveryAddressId: number;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  /**
   * Items to order. When omitted, the whole cart is checked out.
   * Ordered products are removed from the cart either way.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];
}

export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;
}

export class UpdateStoreOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @IsIn(PAYMENT_STATUSES)
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionId?: string;
}

export class UpdateDeliveryDto {
  @IsOptional()
  @IsIn(DELIVERY_STATUSES)
  status?: DeliveryStatus;

  @IsOptional()
  @IsDateString()
  estimatedAt?: string;
}
