import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { TableEntity } from '../../entities/table.entity';
import { Order } from '../../entities/order.entity';
import { EventsModule } from '../events/events.module';
import { QrCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableEntity, Order]),
    EventsModule,
    forwardRef(() => QrCodeModule),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
