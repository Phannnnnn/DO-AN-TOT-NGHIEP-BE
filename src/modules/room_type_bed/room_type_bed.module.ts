import { forwardRef, Module } from '@nestjs/common';
import { RoomTypeBedService } from './room_type_bed.service';
import { RoomTypeBedController } from './room_type_bed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeBed } from '../../entities/room-type-bed.entity';
import { RoomTypeModule } from '../room_type/room_type.module';
import { RoomBedModule } from '../romm_bed/room_bed.module';
import { RoomType } from '../../entities/room-type.entity';

@Module({
  controllers: [RoomTypeBedController],
  providers: [RoomTypeBedService],
  imports: [
    TypeOrmModule.forFeature([RoomTypeBed, RoomType]),
    forwardRef(() => RoomTypeModule),
    RoomBedModule,
    forwardRef(() => RoomTypeModule),
  ],
  exports: [RoomTypeBedService],
})
export class RoomTypeBedModule {}
