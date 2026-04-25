import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomAmenity } from '../../entities/room-amenity.entity';
import { RoomAmenityService } from './room-amenity.service';
import { RoomAmenityController } from './room-amenity.controller';

@Module({
  controllers: [RoomAmenityController],
  providers: [RoomAmenityService],
  imports: [TypeOrmModule.forFeature([RoomAmenity])],
})
export class RoomAmenityModule {}
