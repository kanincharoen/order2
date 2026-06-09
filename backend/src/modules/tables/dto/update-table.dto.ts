import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateTableDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  tableNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  seatingCapacity?: number;
}
