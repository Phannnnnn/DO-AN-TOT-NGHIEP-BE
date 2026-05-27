import { forwardRef, Module } from '@nestjs/common';
import { RoomImageService } from './room_image.service';
import { RoomImageController } from './room_image.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomImage } from '../../entities/room-image.entity';
import { RoomTypeModule } from '../room_type/room_type.module';

@Module({
  controllers: [RoomImageController],
  providers: [RoomImageService],
  imports: [
    TypeOrmModule.forFeature([RoomImage]),
    forwardRef(() => RoomTypeModule),
  ],
  exports: [RoomImageService],
})
export class RoomImageModule {}
