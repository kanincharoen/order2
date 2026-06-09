import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { OrderStatus } from '@shared/enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ValidateIf((o) => o.status === OrderStatus.CANCELLED)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  cancellationReason?: string;
}
