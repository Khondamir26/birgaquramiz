import { IsString, IsNotEmpty, IsNumber, Min, MaxLength, IsOptional, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  readonly description: string

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly imageUrl?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  readonly price: number

  @IsInt()
  @Min(0)
  @Type(() => Number)
  readonly stock: number

  @IsString()
  @IsNotEmpty()
  readonly categoryId: string

  @IsOptional()
  @IsString()
  readonly brandId?: string

  @IsOptional()
  readonly specifications?: any
}