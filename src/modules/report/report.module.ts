import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { Room } from '../../entities/room.entity';

@Module({
  controllers: [ReportController],
  providers: [ReportService],
  imports:[TypeOrmModule.forFeature([Booking,BookingDetail,BookingServiceEntity,Room])]
})
export class ReportModule {}
