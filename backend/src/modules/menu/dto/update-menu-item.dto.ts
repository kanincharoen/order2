import { IsString, IsNumber, Min, Max, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999.99)
  price?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;
}
