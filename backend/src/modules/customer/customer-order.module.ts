import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrderController } from './customer-order.controller';
import { CustomerOrderService } from './customer-order.service';
import { QrCodeModule } from '../qr-code';
import { OrdersModule } from '../orders';
import { MenuItem } from '../../entities/menu-item.entity';
import { Order } from '../../entities/order.entity';
import { QrCode } from '../../entities/qr-code.entity';
import { TableEntity } from '../../entities/table.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, Order, QrCode, TableEntity]),
    QrCodeModule,
    OrdersModule,
  ],
  controllers: [CustomerOrderController],
  providers: [CustomerOrderService],
})
export class CustomerOrderModule {}
