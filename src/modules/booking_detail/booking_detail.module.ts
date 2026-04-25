import { Module } from '@nestjs/common';
import { BookingDetailService } from './booking_detail.service';
import { BookingDetailController } from './booking_detail.controller';

@Module({
  controllers: [BookingDetailController],
  providers: [BookingDetailService],
})
export class BookingDetailModule {}
