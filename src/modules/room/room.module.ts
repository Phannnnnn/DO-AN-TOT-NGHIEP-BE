import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../../entities/room.entity';
import { RoomType } from '../../entities/room-type.entity';
import { RoomTypeModule } from '../room_type/room_type.module';

@Module({
  controllers: [RoomController],
  providers: [RoomService],

  imports: [TypeOrmModule.forFeature([Room, RoomType]), RoomTypeModule],
})
export class RoomModule {}
