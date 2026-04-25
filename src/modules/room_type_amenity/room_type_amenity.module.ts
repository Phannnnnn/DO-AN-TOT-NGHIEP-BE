import { Module } from '@nestjs/common';
import { RoomTypeAmenityService } from './room_type_amenity.service';
import { RoomTypeAmenityController } from './room_type_amenity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';

@Module({
  controllers: [RoomTypeAmenityController],
  providers: [RoomTypeAmenityService],
  imports: [TypeOrmModule.forFeature([RoomTypeAmenity])],
})
export class RoomTypeAmenityModule {}
