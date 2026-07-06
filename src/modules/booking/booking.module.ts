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
import { RoomHoldModule } from '../room_hold/room_hold.module';
import { BookingScheduler } from './booking.scheduler';
import { HousekeepingTaskModule } from '../housekeeping_task/housekeeping_task.module';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingScheduler],
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
    RoomHoldModule,
    HousekeepingTaskModule,
  ],
  exports: [BookingService],
})
export class BookingModule {}
