import { Module } from '@nestjs/common';
import { PricePlanService } from './price_plan.service';
import { PricePlanController } from './price_plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricePlan } from '../../entities/price-plan.entity';
import { RoomTypeModule } from '../room_type/room_type.module';

@Module({
  controllers: [PricePlanController],
  providers: [PricePlanService],
  imports: [TypeOrmModule.forFeature([PricePlan]), RoomTypeModule],
})
export class PricePlanModule {}
