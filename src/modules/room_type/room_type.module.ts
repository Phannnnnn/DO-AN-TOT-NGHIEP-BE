import { Module } from '@nestjs/common';
import { RoomTypeService } from './room_type.service';
import { RoomTypeController } from './room_type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from '../../entities/room-type.entity';
import { RoomAmenity } from '../../entities/room-amenity.entity';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { RoomBed } from '../../entities/room-bed.entity';
import { RoomImage } from '../../entities/room-image.entity';
import { PricePlan } from '../../entities/price-plan.entity';

@Module({
  controllers: [RoomTypeController],
  providers: [RoomTypeService],
  exports: [RoomTypeService],
  imports: [
    TypeOrmModule.forFeature([
      RoomType,
      RoomAmenity,
      RoomTypeAmenity,
      RoomBed,
      RoomImage,
      PricePlan,
    ]),
  ],
})
export class RoomTypeModule {}
