import { Module } from '@nestjs/common';
import { BookingDetailService } from './booking_detail.service';
import { BookingDetailController } from './booking_detail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingDetail } from '../../entities/booking-detail.entity';

@Module({
  controllers: [BookingDetailController],
  providers: [BookingDetailService],
  imports: [TypeOrmModule.forFeature([BookingDetail])],
})
export class BookingDetailModule {}
