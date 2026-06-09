import { IsUUID, IsInt, Min, Max, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialInstructions?: string;
}
