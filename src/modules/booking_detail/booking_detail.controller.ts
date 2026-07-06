import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { BookingDetailService } from './booking_detail.service';

@Controller('booking-detail')
export class BookingDetailController {
  constructor(private readonly bookingDetailService: BookingDetailService) {}

  @Patch(':id/check-in')
  async checkIn(@Param('id', ParseIntPipe) bookingDetailId: number) {
    return this.bookingDetailService.checkIn(bookingDetailId);
  }

  @Patch(':id/check-out')
  async checkOut(@Param('id', ParseIntPipe) bookingDetailId: number) {
    return this.bookingDetailService.checkOut(bookingDetailId);
  }
}
