import { forwardRef, Module } from '@nestjs/common';
import { RoomTypeService } from './room_type.service';
import { RoomTypeController } from './room_type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from '../../entities/room-type.entity';
import { RoomAmenity } from '../../entities/room-amenity.entity';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { RoomImage } from '../../entities/room-image.entity';
import { PricePlan } from '../../entities/price-plan.entity';
import { RoomTypeBed } from '../../entities/room-type-bed.entity';
import { RoomTypeAmenityModule } from '../room_type_amenity/room_type_amenity.module';
import { RoomTypeBedModule } from '../room_type_bed/room_type_bed.module';
import { PricePlanModule } from '../price_plan/price_plan.module';
import { RoomImageModule } from '../room_image/room_image.module';

@Module({
  controllers: [RoomTypeController],
  providers: [RoomTypeService],
  imports: [
    forwardRef(() => RoomTypeAmenityModule),
    forwardRef(() => RoomTypeBedModule),
    forwardRef(() => PricePlanModule),
    forwardRef(() => RoomImageModule),
    TypeOrmModule.forFeature([
      RoomType,
      RoomAmenity,
      RoomTypeAmenity,
      RoomTypeBed,
      RoomImage,
      PricePlan,
    ]),
  ],
  exports: [RoomTypeService],
})
export class RoomTypeModule {}
