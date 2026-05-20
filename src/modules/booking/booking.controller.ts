import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AvailableRoomsQueryDto } from './dto/available-rooms-query.dto';
import { CheckInDto } from './dto/check-in-dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get('available-rooms')
  getAvailableRooms(@Query() query: AvailableRoomsQueryDto) {
    return this.bookingService.getAvailableRooms(query);
  }

  @Get()
  bookings() {
    return this.bookingService.bookings();
  }

  @Get(':id')
  bookingById(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingService.bookingById(bookingId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.update(bookingId, updateBookingDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(
      bookingId,
      updateBookingStatusDto.status,
    );
  }

  @Patch(':id/check-in')
  checkIn(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() checkInDto: CheckInDto,
  ) {
    return this.bookingService.checkIn(bookingId, checkInDto);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingService.checkOut(bookingId);
  }

  @Delete(':id')
  remove(@Param('id') bookingId: number) {
    return this.bookingService.remove(bookingId);
  }
}
