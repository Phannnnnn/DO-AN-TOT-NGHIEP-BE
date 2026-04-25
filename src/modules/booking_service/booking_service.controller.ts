import { Controller } from '@nestjs/common';
import { BookingServiceService } from './booking_service.service';

@Controller('booking-service')
export class BookingServiceController {
  constructor(private readonly bookingServiceService: BookingServiceService) {}
}
