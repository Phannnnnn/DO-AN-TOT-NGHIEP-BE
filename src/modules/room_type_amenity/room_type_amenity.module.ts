import { forwardRef, Module } from '@nestjs/common';
import { RoomTypeAmenityService } from './room_type_amenity.service';
import { RoomTypeAmenityController } from './room_type_amenity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { RoomTypeModule } from '../room_type/room_type.module';
import { RoomAmenityModule } from '../room_amenity/room-amenity.module';

@Module({
  controllers: [RoomTypeAmenityController],
  providers: [RoomTypeAmenityService],
  imports: [
    TypeOrmModule.forFeature([RoomTypeAmenity]),
    RoomAmenityModule,
    forwardRef(() => RoomTypeModule),
  ],
  exports: [RoomTypeAmenityService],
})
export class RoomTypeAmenityModule {}
