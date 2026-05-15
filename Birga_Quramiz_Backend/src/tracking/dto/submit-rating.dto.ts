import { IsInt, IsOptional, IsString, IsArray, Max, Min, MaxLength, ArrayMaxSize } from 'class-validator'

export class SubmitRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[]
}
