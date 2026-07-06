import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { Room } from '../../entities/room.entity';
import { HousekeepingTask } from '../../entities/housekeeping-task.entity';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  imports: [TypeOrmModule.forFeature([Booking, Room, HousekeepingTask])],
})
export class DashboardModule {}
