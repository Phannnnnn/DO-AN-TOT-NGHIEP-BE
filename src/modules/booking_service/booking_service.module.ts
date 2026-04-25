import { Module } from '@nestjs/common';
import { BookingServiceService } from './booking_service.service';
import { BookingServiceController } from './booking_service.controller';

@Module({
  controllers: [BookingServiceController],
  providers: [BookingServiceService],
})
export class BookingServiceModule {}
