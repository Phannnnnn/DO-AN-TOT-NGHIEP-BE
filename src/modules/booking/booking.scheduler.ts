import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, In, Not } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { BookingService } from './booking.service';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
@Injectable()
export class BookingScheduler {
  private readonly logger = new Logger(BookingScheduler.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingService: BookingService,
  ) {}
  async onApplicationBootstrap() {
    this.logger.log('Processing expired bookings on startup...');
    await this.cancelExpiredBookings();
    await this.cancelUnpaidPendingBookings();
    this.logger.log('Done processing expired bookings.');
  }
  @Cron('5 0 * * *')
  async cancelExpiredBookings() {
    const now = new Date();
    const today = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await this.bookingService.autoCompleteExpiredBookings(today);
    const expired = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        checkOutDate: LessThan(today),
        actualCheckIn: IsNull(),
        paymentStatus: Not(PaymentStatus.PAID),
      },
    });
    if (!expired.length) return;
    await this.bookingRepository.update(
      { bookingId: In(expired.map((b) => b.bookingId)) },
      { status: BookingStatus.CANCELLED },
    );
    this.logger.log(
      `Đã huỷ ${expired.length} booking chưa check-in quá ngày trả phòng (chưa thanh toán): [${expired.map((b) => b.bookingId).join(', ')}]`,
    );
  }
  @Cron('*/15 * * * *')
  async cancelUnpaidPendingBookings() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const pending = await this.bookingRepository.find({
      where: {
        status: BookingStatus.PENDING,
        created_At: LessThan(cutoff),
      },
    });
    if (!pending.length) return;
    await this.bookingRepository.update(
      { bookingId: In(pending.map((b) => b.bookingId)) },
      { status: BookingStatus.CANCELLED },
    );
    this.logger.log(
      `Đã huỷ ${pending.length} booking PENDING quá hạn thanh toán: [${pending.map((b) => b.bookingId).join(', ')}]`,
    );
  }
}
