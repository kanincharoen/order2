import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerOrderService } from './customer-order.service';
import { IsArray, ArrayMinSize, ValidateNested, IsUUID, IsInt, Min, Max, IsString, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerOrderItemDto {
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

class CustomerCreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderItemDto)
  items!: CustomerOrderItemDto[];
}

@Controller('customer')
export class CustomerOrderController {
  constructor(private readonly customerService: CustomerOrderService) {}

  @Get('menu/:token')
  getMenuForSession(@Param('token') token: string) {
    return this.customerService.getMenuForSession(token);
  }

  @Post('orders/:token')
  @HttpCode(HttpStatus.CREATED)
  placeOrder(
    @Param('token') token: string,
    @Body() dto: CustomerCreateOrderDto,
  ) {
    return this.customerService.placeOrder(token, dto.items);
  }

  @Get('orders/:token/status')
  getOrderStatus(@Param('token') token: string) {
    return this.customerService.getOrdersForSession(token);
  }
}
