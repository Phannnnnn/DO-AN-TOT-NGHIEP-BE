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

  // ─── Thêm dịch vụ vào booking detail ────────────────────────────
  async addService(bookingDetailId: number, dto: CreateBookingServiceDto) {
    const detail = await this.bookingDetailRepository.findOne({
      where: { bookingDetailId },
      relations: { booking: true },
    });
    if (!detail) {
      throw new NotFoundException(
        `Không tìm thấy booking detail có ID "${bookingDetailId}"`,
      );
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
      quantity: dto.quantity,
      priceAtUsage: Number(service.price),
    });

    const saved = await this.bookingServiceRepository.save(bookingService);
    await this.bookingService.recalculateTotalAmount(detail.booking.bookingId);
    return saved;
  }

  // ─── Lấy danh sách dịch vụ theo booking detail ──────────────────
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
      relations: { service: true },
    });
  }

  // ─── Xóa dịch vụ ────────────────────────────────────────────────
  async removeService(bookingServiceId: number) {
    const bookingService = await this.bookingServiceRepository.findOne({
      where: { bookingServiceId },
      relations: { bookingDetail: true },
    });
    if (!bookingService) {
      throw new NotFoundException(`Dịch vụ không tồn tại trên hệ thống.`);
    }

    const removed = await this.bookingServiceRepository.remove(bookingService);
    await this.bookingService.recalculateTotalAmount(
      bookingService.bookingDetail.booking.bookingId,
    );
    return removed;
  }
}
