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
  Request,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AvailableRoomsQueryDto } from './dto/available-rooms-query.dto';
import { CheckInDto } from './dto/check-in-dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { BookingsQueryDto } from './dto/bookings-query.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get('available-rooms')
  getAvailableRooms(@Query() query: AvailableRoomsQueryDto) {
    return this.bookingService.getAvailableRooms(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  myBookings(@Request() req: any) {
    const userId = req.user.id;
    return this.bookingService.bookingByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelMyBooking(
    @Param('id', ParseIntPipe) bookingId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.bookingService.cancelBookingByUser(bookingId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Get()
  bookings(@Query() query: BookingsQueryDto) {
    return this.bookingService.bookings({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Get(':id')
  bookingById(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingService.bookingById(bookingId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Get('customer/:id')
  bookingByCustomerId(@Param('id') customerId: number) {
    return this.bookingService.bookingByCustomerId(customerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.update(bookingId, updateBookingDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Patch(':id/check-in')
  checkIn(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() checkInDto: CheckInDto,
  ) {
    return this.bookingService.checkIn(bookingId, checkInDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Patch(':id/check-out')
  checkOut(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingService.checkOut(bookingId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') bookingId: number) {
    return this.bookingService.remove(bookingId);
  }
}
