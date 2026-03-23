import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pros?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cons?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
