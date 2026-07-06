import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../../entities/room.entity';
import { RoomType } from '../../entities/room-type.entity';
import { RoomTypeModule } from '../room_type/room_type.module';
import { HousekeepingTaskModule } from '../housekeeping_task/housekeeping_task.module';
import { HousekeepingTask } from '../../entities/housekeeping-task.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';

@Module({
  controllers: [RoomController],
  providers: [RoomService],
  imports: [
    TypeOrmModule.forFeature([Room, RoomType, BookingDetail, HousekeepingTask]),
    RoomTypeModule,
    HousekeepingTaskModule,
  ],
  exports: [RoomService],
})
export class RoomModule {}
