import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomHold } from '../../entities/room-hold.entity';
import { RoomHoldService } from './room_hold.service';
import { RoomHoldController } from './room_hold.controller';
import { RoomHoldScheduler } from './dto/room_hold.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([RoomHold])],
  controllers: [RoomHoldController],
  providers: [RoomHoldService, RoomHoldScheduler],
  exports: [RoomHoldService],
})
export class RoomHoldModule {}
