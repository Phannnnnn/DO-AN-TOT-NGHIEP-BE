import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BookingServiceService } from './booking_service.service';
import { CreateBookingServiceDto } from './dto/create-booking-service.dto';

@Controller('booking-service')
export class BookingServiceController {
  constructor(private readonly bookingServiceService: BookingServiceService) {}

  @Post(':bookingDetailId')
  async addService(
    @Param('bookingDetailId', ParseIntPipe) bookingDetailId: number,
    @Body() dto: CreateBookingServiceDto,
  ) {
    return this.bookingServiceService.addService(bookingDetailId, dto);
  }

  @Get(':bookingDetailId')
  async servicesByBookingDetail(
    @Param('bookingDetailId', ParseIntPipe) bookingDetailId: number,
  ) {
    return this.bookingServiceService.servicesByBookingDetail(bookingDetailId);
  }

  @Delete(':bookingServiceId')
  async removeService(
    @Param('bookingServiceId', ParseIntPipe) bookingServiceId: number,
  ) {
    return this.bookingServiceService.removeService(bookingServiceId);
  }
}
