import { IsString, IsNumber, Min, MaxLength, IsOptional } from 'class-validator'

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
  @MaxLength(2000000)
  readonly imageUrl?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly stock?: number
}