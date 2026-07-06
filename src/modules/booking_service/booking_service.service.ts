import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { Service } from '../../entities/service.entity';
import { CreateBookingServiceDto } from './dto/create-booking-service.dto';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { UserRole } from '../../entities/user.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
@Injectable()
export class BookingServiceService {
  constructor(
    @InjectRepository(BookingServiceEntity)
    private readonly bookingServiceRepository: Repository<BookingServiceEntity>,
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}
  async addService(
    bookingDetailId: number,
    dto: CreateBookingServiceDto,
    user: any,
  ) {
    const detail = await this.bookingDetailRepository.findOne({
      where: { bookingDetailId },
      relations: { booking: { customer: { user: true } } },
    });
    if (!detail) {
      throw new NotFoundException(
        `Không tìm thấy booking detail có ID "${bookingDetailId}"`,
      );
    }
    if (detail.booking.servicePaymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Không thể thêm dịch vụ do dịch vụ của đơn đặt phòng này đã được thanh toán.',
      );
    }
    if (user.role === UserRole.USER) {
      if (
        !detail.booking.customer ||
        detail.booking.customer.user?.id !== user.id
      ) {
        throw new BadRequestException(
          'Bạn không có quyền thêm dịch vụ cho phòng này.',
        );
      }
      if (
        detail.booking.status !== BookingStatus.CONFIRMED ||
        !detail.booking.actualCheckIn ||
        detail.booking.actualCheckOut
      ) {
        throw new BadRequestException(
          'Chỉ có thể thêm dịch vụ cho phòng bạn đang lưu trú (đã nhận phòng và chưa trả phòng).',
        );
      }
    }
    const service = await this.serviceRepository.findOne({
      where: { serviceId: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(
        `Không tìm thấy dịch vụ có ID "${dto.serviceId}"`,
      );
    }
    const bookingService = this.bookingServiceRepository.create({
      bookingDetailId,
      serviceId: dto.serviceId,
      serviceName: service.serviceName,
      unit: service.unit ?? null,
      quantity: dto.quantity,
      priceAtUsage: Number(service.price),
    });
    const saved = await this.bookingServiceRepository.save(bookingService);
    await this.bookingService.recalculateServiceAmount(
      detail.booking.bookingId,
    );
    return saved;
  }
  async servicesByBookingDetail(bookingDetailId: number) {
    const detail = await this.bookingDetailRepository.findOne({
      where: { bookingDetailId },
    });
    if (!detail) {
      throw new NotFoundException(
        `Chi tiết đơn đặt phòng không tồn tại trên hệ thống.`,
      );
    }
    return this.bookingServiceRepository.find({
      where: { bookingDetailId },
    });
  }
  async removeService(bookingServiceId: number) {
    const bookingService = await this.bookingServiceRepository.findOne({
      where: { bookingServiceId },
      relations: { bookingDetail: { booking: true } },
    });
    if (!bookingService) {
      throw new NotFoundException(`Dịch vụ không tồn tại trên hệ thống.`);
    }
    const removed = await this.bookingServiceRepository.remove(bookingService);
    await this.bookingService.recalculateServiceAmount(
      bookingService.bookingDetail.booking.bookingId,
    );
    return removed;
  }
}
