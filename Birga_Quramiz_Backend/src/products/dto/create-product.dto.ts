import { IsString, IsNotEmpty, IsNumber, Min, MaxLength, IsOptional } from 'class-validator'

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
  readonly price: number

  @IsNumber()
  @Min(0)
  readonly stock: number
}
