import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking } from '../../entities/booking.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  //Test
  async sendTestMail(email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Test email',
      html: '<p>Nếu bạn nhận được email này thì mail đã hoạt động!</p>',
    });
  }
  async sendBookingConfirmation(booking: Booking) {
    const email = booking.guestEmail ?? booking.customer?.email;
    if (!email) return;

    await this.mailerService.sendMail({
      to: email,
      subject: `Xác nhận đặt phòng #${booking.bookingId}`,
      template: 'booking-confirmation',
      context: {
        bookingId: booking.bookingId,
        guestName: booking.guestName ?? booking.customer?.fullName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: Number(booking.totalAmount).toLocaleString('vi-VN'),
        rooms: booking.bookingDetails
          ?.map((d) => d.room?.roomNumber)
          .join(', '),
      },
    });
  }

  async sendPaymentConfirmation(booking: Booking) {
    const email = booking.guestEmail ?? booking.customer?.email;
    if (!email) return;

    await this.mailerService.sendMail({
      to: email,
      subject: `Xác nhận thanh toán booking #${booking.bookingId}`,
      template: 'payment-confirmation',
      context: {
        bookingId: booking.bookingId,
        guestName: booking.guestName ?? booking.customer?.fullName,
        totalAmount: Number(booking.totalAmount).toLocaleString('vi-VN'),
        paymentMethod: booking.paymentMethod === 'vnpay' ? 'VNPAY' : 'Tiền mặt',
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
      },
    });
  }

  async sendCheckInReminder(booking: Booking) {
    const email = booking.guestEmail ?? booking.customer?.email;
    if (!email) return;

    await this.mailerService.sendMail({
      to: email,
      subject: `Nhắc nhở check-in ngày mai - Booking #${booking.bookingId}`,
      template: 'checkin-reminder',
      context: {
        bookingId: booking.bookingId,
        guestName: booking.guestName ?? booking.customer?.fullName,
        checkInDate: booking.checkInDate,
        rooms: booking.bookingDetails
          ?.map((d) => d.room?.roomNumber)
          .join(', '),
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCheckInReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const bookings = await this.bookingRepository.find({
      where: { checkInDate: dateStr },
      relations: { customer: true, bookingDetails: { room: true } },
    });

    for (const booking of bookings) {
      try {
        await this.sendCheckInReminder(booking);
        this.logger.log(
          `Sent check-in reminder for booking #${booking.bookingId}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to send reminder for booking #${booking.bookingId}`,
          err,
        );
      }
    }
  }
}
