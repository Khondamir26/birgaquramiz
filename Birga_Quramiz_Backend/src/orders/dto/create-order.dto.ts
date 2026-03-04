import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator'
import { Type } from 'class-transformer'

export enum DeliveryTypeDto {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export enum PaymentMethodDto {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  readonly productId: string

  @IsInt()
  @Min(1)
  @Type(() => Number)
  readonly quantity: number
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly items: OrderItemDto[]

  @IsString()
  @IsNotEmpty()
  readonly customerName: string

  @IsString()
  @IsNotEmpty()
  readonly customerPhone: string

  @IsEnum(DeliveryTypeDto)
  readonly deliveryType: DeliveryTypeDto

  @IsOptional()
  @IsString()
  readonly deliveryAddress?: string

  @IsEnum(PaymentMethodDto)
  readonly paymentMethod: PaymentMethodDto

  @IsOptional()
  @IsString()
  readonly comment?: string
}