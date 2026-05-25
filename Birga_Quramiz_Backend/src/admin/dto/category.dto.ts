import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string

  @IsOptional()
  @IsString()
  nameEn?: string

  @IsOptional()
  @IsString()
  nameUz?: string

  @IsString()
  @MinLength(1)
  code!: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsString()
  parentId?: string | null
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  nameEn?: string

  @IsOptional()
  @IsString()
  nameUz?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsString()
  parentId?: string | null
}
