import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { MailModule } from '../mail/mail.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BookingModule } from '../booking/booking.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [TypeOrmModule.forFeature([Booking]), MailModule, BookingModule],
  exports: [PaymentService],
})
export class PaymentModule {}
