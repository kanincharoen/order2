import { IsEnum } from 'class-validator';
import { TableStatus } from '@shared/enums';

export class UpdateTableStatusDto {
  @IsEnum(TableStatus)
  status!: TableStatus;
}
