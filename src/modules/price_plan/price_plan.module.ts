import { forwardRef, Module } from '@nestjs/common';
import { PricePlanService } from './price_plan.service';
import { PricePlanController } from './price_plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricePlan } from '../../entities/price-plan.entity';
import { RoomTypeModule } from '../room_type/room_type.module';
import { PricePlanScheduler } from './price_plan.scheduler';

@Module({
  controllers: [PricePlanController],
  providers: [PricePlanService, PricePlanScheduler],
  imports: [
    TypeOrmModule.forFeature([PricePlan]),
    forwardRef(() => RoomTypeModule),
  ],
  exports: [PricePlanService],
})
export class PricePlanModule {}
