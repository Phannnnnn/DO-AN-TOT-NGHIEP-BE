import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
@Injectable()
export class BookingDetailService {
  constructor(
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
  ) {}
  private async findDetailById(
    bookingDetailId: number,
  ): Promise<BookingDetail> {
    const detail = await this.bookingDetailRepository.findOne({
      where: { bookingDetailId },
      relations: { booking: true, room: true },
    });
    if (!detail) {
      throw new NotFoundException(
        `Không tìm thấy booking detail có ID "${bookingDetailId}"`,
      );
    }
    return detail;
  }
  async checkIn(bookingDetailId: number) {
    const detail = await this.findDetailById(bookingDetailId);
    if (detail.booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Chỉ có thể check-in khi booking đã được xác nhận',
      );
    }
    return this.bookingDetailRepository.save(detail);
  }
  async checkOut(bookingDetailId: number) {
    const detail = await this.findDetailById(bookingDetailId);
    return this.bookingDetailRepository.save(detail);
  }
}
