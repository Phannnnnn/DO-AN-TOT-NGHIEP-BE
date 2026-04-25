import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Room } from '../../entities/room.entity';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const toVNDate = (date: Date) => {
      // UTC+7
      const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return new Date(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate(),
      );
    };

    const checkInDate = toVNDate(checkIn);
    const checkOutDate = toVNDate(checkOut);

    const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
    const nights = diffInMs / (1000 * 60 * 60 * 24);

    return nights > 0 ? nights : 1;
  }

  private readonly TIME_BUFFER = 30;

  async checkRoomAvailability(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    bookingId?: number,
  ): Promise<boolean> {
    if (checkIn >= checkOut) {
      throw new BadRequestException('Ngày check-in phải trước ngày check-out');
    }

    const checkOutWithBuffer = new Date(checkOut);
    checkOutWithBuffer.setMinutes(
      checkOutWithBuffer.getMinutes() + this.TIME_BUFFER,
    );

    const checkInWithBuffer = new Date(checkIn);
    checkInWithBuffer.setMinutes(
      checkInWithBuffer.getMinutes() - this.TIME_BUFFER,
    );

    const overlapBooking = await this.bookingDetailRepository.findOne({
      where: {
        roomId,
        checkInPlan: LessThan(checkOutWithBuffer),
        checkOutPlan: MoreThan(checkInWithBuffer),
        booking: {
          status: Not(BookingStatus.CANCELLED),
          ...(bookingId && { bookingId: Not(bookingId) }),
        },
      },
      relations: { booking: true },
    });

    return !overlapBooking;
  }

  async create(createBookingDto: CreateBookingDto) {
    let totalAmount = 0;

    const bookingDetails = await Promise.all(
      createBookingDto.bookingDetails.map(async (item) => {
        // 1. Tìm phòng
        const room = await this.roomRepository.findOne({
          where: { roomId: item.roomId },
          relations: { roomType: true },
        });
        if (!room) {
          throw new NotFoundException(
            `Không tìm thấy phòng có ID "${item.roomId}"`,
          );
        }

        // 2. Parse ngày
        const checkIn = new Date(item.checkInPlan);
        const checkOut = new Date(item.checkOutPlan);

        // 3. Kiểm tra trùng lịch
        const isAvailable = await this.checkRoomAvailability(
          item.roomId,
          checkIn,
          checkOut,
        );

        if (!isAvailable) {
          throw new ConflictException(
            `Phòng '${room.roomNumber}' đã được đặt trong khoảng thời gian này`,
          );
        }

        // 4. Tính tiền
        const priceAtBooking = Number(room.roomType.pricePlans);
        const nights = this.calculateNights(checkIn, checkOut);
        totalAmount += priceAtBooking * nights;

        return {
          roomId: item.roomId,
          checkInPlan: checkIn,
          checkOutPlan: checkOut,
          priceAtBooking,
        };
      }),
    );

    // 5. Lưu booking
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      totalAmount,
      bookingDetails,
    });

    return this.bookingRepository.save(booking);
  }

  // ─── Update booking ─────────────────────────────────────────────
  async update(bookingId: number, updateBookingDto: UpdateBookingDto) {
    // 1. Kiểm tra booking tồn tại không
    const existingBooking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: true },
    });
    if (!existingBooking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }

    let totalAmount = 0;

    // const bookingDetails = await Promise.all(
    //   updateBookingDto.bookingDetails.map(async (item) => {
    //     // 2. Tìm phòng
    //     const room = await this.roomRepository.findOne({
    //       where: { roomId: item.roomId },
    //       relations: { roomType: true },
    //     });
    //     if (!room) {
    //       throw new NotFoundException(
    //         `Không tìm thấy phòng có ID "${item.roomId}"`,
    //       );
    //     }

    //     // 3. Parse ngày
    //     const checkIn = new Date(item.checkInPlan);
    //     const checkOut = new Date(item.checkOutPlan);

    //     // 4. Kiểm tra trùng lịch, truyền bookingId để bỏ qua chính nó
    //     const isAvailable = await this.checkRoomAvailability(
    //       item.roomId,
    //       checkIn,
    //       checkOut,
    //       bookingId, // ← quan trọng: bỏ qua booking đang sửa
    //     );

    //     if (!isAvailable) {
    //       throw new BadRequestException(
    //         `Phòng '${room.roomNumber}' đã được đặt trong khoảng thời gian này`,
    //       );
    //     }

    //     // 5. Tính tiền
    //     const priceAtBooking = Number(room.roomType.basePrice);
    //     const nights = this.calculateNights(checkIn, checkOut);
    //     totalAmount += priceAtBooking * nights;

    //     return {
    //       roomId: item.roomId,
    //       checkInPlan: checkIn,
    //       checkOutPlan: checkOut,
    //       priceAtBooking,
    //     };
    //   }),
    // );

    // 6. Ghi đè bookingDetails cũ và lưu lại
    // existingBooking.bookingDetails = bookingDetails as BookingDetail[];
    // existingBooking.totalAmount = totalAmount;
    // Object.assign(existingBooking, updateBookingDto);

    return updateBookingDto;
  }

  // ─── Lấy tất cả booking ─────────────────────────────────────────
  bookings() {
    return this.bookingRepository.find({ relations: { bookingDetails: true } });
  }

  // ─── Lấy booking theo ID ─────────────────────────────────────────
  bookingById(bookingId: number) {
    return this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: true },
    });
  }
}
