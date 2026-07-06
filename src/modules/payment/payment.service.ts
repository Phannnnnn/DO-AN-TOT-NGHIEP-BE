import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VNPay, ignoreLogger, ProductCode, VnpLocale } from 'vnpay';
import { Booking } from '../../entities/booking.entity';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { MailService } from '../mail/mail.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class PaymentService {
  private readonly vnpay: VNPay;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingService: BookingService,
    private readonly mailService: MailService,
  ) {
    this.vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE!,
      secureSecret: process.env.VNPAY_HASH_SECRET!,
      vnpayHost: process.env.VNPAY_URL!,
      loggerFn: ignoreLogger,
    });
  }

  async createPaymentUrl(bookingId: number, ipAddr: string): Promise<string> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking không tồn tại');
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking này đã được thanh toán');
    }

    return this.vnpay.buildPaymentUrl({
      vnp_Amount: Number(booking.totalAmount),
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: String(bookingId),
      vnp_OrderInfo: `Thanh toan booking #${bookingId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL!,
      vnp_Locale: VnpLocale.VN,
    });
  }

  async handleIpn(query: Record<string, string>) {
    const result = this.vnpay.verifyReturnUrl(query as any);

    if (!result.isSuccess)
      return { RspCode: '97', Message: 'Invalid signature' };

    const bookingId = Number(result.vnp_TxnRef);
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });

    if (!booking) return { RspCode: '01', Message: 'Order not found' };
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    await this.bookingRepository.update(bookingId, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.VNPAY,
      vnpayTransactionId: result.vnp_TransactionNo?.toString(),
      status: BookingStatus.CONFIRMED,
    });

    const updated = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { customer: true, bookingDetails: { room: true } },
    });
    this.mailService.sendPaymentConfirmation(updated!).catch(() => {});

    return { RspCode: '00', Message: 'Confirm success' };
  }

  async payCash(bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Đơn đặt phòng không tồn tại.');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn đặt phòng này đã được thanh toán');
    }

    const updated = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { customer: true, bookingDetails: { room: true } },
    });

    updated!.paymentMethod = PaymentMethod.CASH;
    updated!.paymentStatus = PaymentStatus.PAID;
    updated!.status = BookingStatus.CONFIRMED;

    await this.bookingRepository.save(updated!);

    this.mailService.sendPaymentConfirmation(updated!).catch(() => {});

    return this.bookingService.bookingById(bookingId);
  }

  // ─── Thanh toán dịch vụ bằng tiền mặt ───────────────────────────
  async payServiceCash(bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Đơn đặt phòng không tồn tại.');
    }

    if (booking.servicePaymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Dịch vụ đã được thanh toán.');
    }

    await this.bookingRepository.update(bookingId, {
      servicePaymentMethod: PaymentMethod.CASH,
      servicePaymentStatus: PaymentStatus.PAID,
    });

    return this.bookingService.bookingById(bookingId);
  }

  // ─── Tạo URL thanh toán dịch vụ qua VNPAY ───────────────────────
  async createServicePaymentUrl(
    bookingId: number,
    ipAddr: string,
  ): Promise<string> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking không tồn tại');
    if (booking.servicePaymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Dịch vụ đã được thanh toán.');
    }

    return this.vnpay.buildPaymentUrl({
      vnp_Amount: Number(booking.serviceAmount),
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: `svc_${bookingId}`,
      vnp_OrderInfo: `Thanh toan dich vu booking #${bookingId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL!,
      vnp_Locale: VnpLocale.VN,
    });
  }

  // ─── IPN handler cho thanh toán dịch vụ ─────────────────────────
  async handleServiceIpn(query: Record<string, string>) {
    const result = this.vnpay.verifyReturnUrl(query as any);
    if (!result.isSuccess)
      return { RspCode: '97', Message: 'Invalid signature' };

    const txnRef = result.vnp_TxnRef;
    if (!txnRef.startsWith('svc_'))
      return { RspCode: '01', Message: 'Invalid txn ref' };

    const bookingId = Number(txnRef.replace('svc_', ''));
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });

    if (!booking) return { RspCode: '01', Message: 'Order not found' };
    if (booking.servicePaymentStatus === PaymentStatus.PAID) {
      return { RspCode: '02', Message: 'Already confirmed' };
    }

    await this.bookingRepository.update(bookingId, {
      servicePaymentStatus: PaymentStatus.PAID,
      servicePaymentMethod: PaymentMethod.VNPAY,
      serviceVnpayTransactionId: result.vnp_TransactionNo?.toString(),
    });

    return { RspCode: '00', Message: 'Confirm success' };
  }

  async verifyPaymentReturn(query: Record<string, string>) {
    const result = this.vnpay.verifyReturnUrl(query as any);
    if (!result.isVerified) {
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    const txnRef = result.vnp_TxnRef;
    const isService = txnRef.startsWith('svc_');
    const bookingId = Number(isService ? txnRef.replace('svc_', '') : txnRef);

    return this.bookingService.bookingById(bookingId);
  }
}
