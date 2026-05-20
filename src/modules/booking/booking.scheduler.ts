import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Injectable()
export class BookingScheduler {
  private readonly logger = new Logger(BookingScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  // Chạy lúc 00:05 mỗi ngày
  @Cron('5 0 * * *')
  async cancelExpiredBookings() {
    const today = new Date().toISOString().slice(0, 10);

    const expired = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        checkInDate: LessThan(today),
        actualCheckIn: IsNull(),
      },
    });

    if (!expired.length) return;

    await this.bookingRepository.update(
      expired.map((b) => b.bookingId),
      { status: BookingStatus.CANCELLED },
    );

    this.logger.log(
      `Đã huỷ ${expired.length} booking quá hạn check-in: [${expired.map((b) => b.bookingId).join(', ')}]`,
    );
  }
}
