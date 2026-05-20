import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [VnpayController],
  providers: [VnpayService],
  imports: [TypeOrmModule.forFeature([Booking]), MailModule],
  exports: [VnpayService],
})
export class VnpayModule {}
