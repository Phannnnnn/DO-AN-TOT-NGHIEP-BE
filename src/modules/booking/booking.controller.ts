import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    const booking = await this.bookingService.create(createBookingDto);
    if (booking) {
      return { success: true, booking };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Get()
  async bookings() {
    const bookings = await this.bookingService.bookings();
    if (bookings) {
      return { success: true, bookings };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Get(':id')
  async bookingById(@Param('id') bookingId: number) {
    const booking = await this.bookingService.bookingById(bookingId);
    if (booking) {
      return { success: true, booking };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Patch(':id')
  async update(
    @Param('id') bookingId: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    const booking = await this.bookingService.update(
      bookingId,
      updateBookingDto,
    );
    if (booking) {
      return { success: true, booking };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }
}
