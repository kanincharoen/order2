import { IsUUID, IsInt, Min, Max, IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateOrderItemDto {
  @IsOptional()
  @IsUUID()
  menuItemId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialInstructions?: string;
}
