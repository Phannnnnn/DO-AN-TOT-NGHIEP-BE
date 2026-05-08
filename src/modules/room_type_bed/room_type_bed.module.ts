import { forwardRef, Module } from '@nestjs/common';
import { RoomTypeBedService } from './room_type_bed.service';
import { RoomTypeBedController } from './room_type_bed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeBed } from '../../entities/room-type-bed.entity';
import { RoomTypeModule } from '../room_type/room_type.module';
import { RoomBedModule } from '../romm_bed/room_bed.module';

@Module({
  controllers: [RoomTypeBedController],
  providers: [RoomTypeBedService],
  imports: [
    TypeOrmModule.forFeature([RoomTypeBed]),
    forwardRef(() => RoomTypeModule),
    RoomBedModule,
  ],
  exports: [RoomTypeBedService],
})
export class RoomTypeBedModule {}
