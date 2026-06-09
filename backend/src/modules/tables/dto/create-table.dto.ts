import { IsInt, Min, Max } from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  @Max(999)
  tableNumber!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  seatingCapacity!: number;
}
