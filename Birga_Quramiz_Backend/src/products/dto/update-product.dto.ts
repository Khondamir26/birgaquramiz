import { IsString, IsNumber, Min, MaxLength, IsOptional, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly name?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly description?: string

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly imageUrl?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  readonly price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  readonly stock?: number
}
