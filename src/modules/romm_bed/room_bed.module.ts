import { forwardRef, Module } from '@nestjs/common';
import { BedController } from './room_bed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomBed } from '../../entities/room-bed.entity';
import { RoomBedService } from './room_bed.service';
import { RoomType } from '../../entities/room-type.entity';
import { RoomTypeModule } from '../room_type/room_type.module';

@Module({
  controllers: [BedController],
  providers: [RoomBedService],
  imports: [TypeOrmModule.forFeature([RoomBed, RoomType])],
  exports: [RoomBedService],
})
export class RoomBedModule {}
