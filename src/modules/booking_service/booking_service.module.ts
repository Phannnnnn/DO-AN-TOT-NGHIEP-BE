import { forwardRef, Module } from '@nestjs/common';
import { BookingServiceService } from './booking_service.service';
import { BookingServiceController } from './booking_service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { Service } from '../../entities/service.entity';
import { BookingModule } from '../booking/booking.module';

@Module({
  controllers: [BookingServiceController],
  providers: [BookingServiceService],
  imports: [
    forwardRef(() => BookingModule),
    TypeOrmModule.forFeature([BookingServiceEntity, BookingDetail, Service]),
  ],
})
export class BookingServiceModule {}
