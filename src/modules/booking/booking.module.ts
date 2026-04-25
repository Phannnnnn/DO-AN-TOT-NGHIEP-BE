import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { Room } from '../../entities/room.entity';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingDetail,
      BookingServiceEntity,
      Room,
    ]),
  ],
})
export class BookingModule {}
