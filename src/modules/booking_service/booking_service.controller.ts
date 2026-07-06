import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingServiceService } from './booking_service.service';
import { CreateBookingServiceDto } from './dto/create-booking-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking-service')
export class BookingServiceController {
  constructor(private readonly bookingServiceService: BookingServiceService) {}

  @Post(':bookingDetailId')
  async addService(
    @Param('bookingDetailId', ParseIntPipe) bookingDetailId: number,
    @Body() dto: CreateBookingServiceDto,
    @Request() req: any,
  ) {
    return this.bookingServiceService.addService(
      bookingDetailId,
      dto,
      req.user,
    );
  }

  @Get(':bookingDetailId')
  async servicesByBookingDetail(
    @Param('bookingDetailId', ParseIntPipe) bookingDetailId: number,
  ) {
    return this.bookingServiceService.servicesByBookingDetail(bookingDetailId);
  }

  @Roles(UserRole.RECEPTIONIST)
  @Delete(':bookingServiceId')
  async removeService(
    @Param('bookingServiceId', ParseIntPipe) bookingServiceId: number,
  ) {
    return this.bookingServiceService.removeService(bookingServiceId);
  }
}
