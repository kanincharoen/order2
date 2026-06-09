import { IsString, IsNumber, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999.99)
  price!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;
}
