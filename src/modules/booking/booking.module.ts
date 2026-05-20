import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { Room } from '../../entities/room.entity';
import { PricePlan } from '../../entities/price-plan.entity';
import { Service } from '../../entities/service.entity';
import { CustomerModule } from '../customer/customer.module';
import { RoomModule } from '../room/room.module';
import { BookingGuest } from '../../entities/booking-guest.entity';
import { MailModule } from '../mail/mail.module';
import { VnpayModule } from '../vnpay/vnpay.module';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingDetail,
      BookingServiceEntity,
      Room,
      PricePlan,
      Service,
      BookingGuest,
    ]),
    CustomerModule,
    RoomModule,
    MailModule,
    VnpayModule,
  ],
  exports: [BookingService],
})
export class BookingModule {}
