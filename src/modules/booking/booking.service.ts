import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Room } from '../../entities/room.entity';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingGuest } from '../../entities/booking-guest.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { RoomStatus } from '../../common/enums/room-status.enum';
import { PricePlan } from '../../entities/price-plan.entity';
import { PricePlanType } from '../../common/enums/price-plan-type.enum';
import { Service } from '../../entities/service.entity';
import { CheckInDto } from './dto/check-in-dto';
import { AvailableRoomsQueryDto } from './dto/available-rooms-query.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
    @InjectRepository(BookingGuest)
    private readonly bookingGuestRepository: Repository<BookingGuest>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(PricePlan)
    private readonly pricePlanRepository: Repository<PricePlan>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly mailService: MailService,
  ) {}

  // ─── Tạo booking ────────────────────────────────────────────────
  async create(createBookingDto: CreateBookingDto) {
    if (!createBookingDto.customerId) {
      if (!createBookingDto.guestName) {
        throw new BadRequestException('Tên khách không được để trống');
      }
      if (!createBookingDto.guestEmail) {
        throw new BadRequestException('Email không được để trống.');
      }
    }

    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);

    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'Ngày nhận phòng phải trước ngày trả phòng.',
      );
    }

    const nights = this.calculateNights(checkIn, checkOut);
    let totalAmount = 0;

    const bookingDetails = await Promise.all(
      createBookingDto.bookingDetails.map(async (item) => {
        const room = await this.roomRepository.findOne({
          where: { roomId: item.roomId },
          relations: { roomType: true },
        });
        if (!room) {
          throw new NotFoundException(`Không tìm thấy phòng trên hệ thống.`);
        }

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

        // priceAtBooking = tổng tiền phòng (tính từng đêm)
        const priceAtBooking = await this.calcRoomTotal(
          room.roomTypeId,
          createBookingDto.checkInDate,
          createBookingDto.checkOutDate,
        );

        totalAmount += priceAtBooking;

        let bookingServices: any[] = [];
        if (item.services?.length) {
          bookingServices = await Promise.all(
            item.services.map(async (s) => {
              const service = await this.serviceRepository.findOne({
                where: { serviceId: s.serviceId },
              });
              if (!service) {
                throw new NotFoundException(
                  `Dịch vụ không tồn tại trên hệ thống.`,
                );
              }
              const priceAtUsage = Number(service.price) * s.quantity;
              totalAmount += priceAtUsage;
              return {
                serviceId: s.serviceId,
                quantity: s.quantity,
                priceAtUsage: Number(service.price),
              };
            }),
          );
        }

        return {
          roomId: item.roomId,
          priceAtBooking,
          bookingServices,
        };
      }),
    );

    const booking = this.bookingRepository.create({
      customerId: createBookingDto.customerId,
      guestName: createBookingDto.guestName ?? null,
      guestPhone: createBookingDto.guestPhone ?? null,
      guestEmail: createBookingDto.guestEmail ?? null,
      checkInDate: createBookingDto.checkInDate,
      checkOutDate: createBookingDto.checkOutDate,
      notes: createBookingDto.notes,
      totalAmount,
      status: BookingStatus.PENDING,
      bookingDetails,
    } as any);

    const saved = await this.bookingRepository.save(booking as any);
    const result = await this.bookingById(
      Array.isArray(saved) ? saved[0].bookingId : saved.bookingId,
    );
    this.mailService.sendBookingConfirmation(result as any).catch(() => {});
    return result;
  }

  // ─── Lấy tất cả booking ─────────────────────────────────────────
  async bookings() {
    const bookings = await this.bookingRepository.find({
      relations: {
        customer: true,
        guests: true,
        bookingDetails: {
          room: {
            roomType: {
              roomTypeBed: { roomBed: true },
              roomImages: true,
              roomTypeAmenities: { roomAmenity: true },
              pricePlans: true,
            },
          },
          bookingServices: { service: true },
        },
      },
      order: { created_At: 'DESC' },
    });
    return bookings.map((b) => this.formatBooking(b));
  }

  // ─── Lấy booking theo ID ─────────────────────────────────────────
  async bookingById(bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: {
        customer: true,
        guests: true,
        bookingDetails: {
          room: {
            roomType: {
              roomTypeBed: { roomBed: true },
              roomImages: true,
              roomTypeAmenities: { roomAmenity: true },
              pricePlans: true,
            },
          },
          bookingServices: { service: true },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException(`Đơn đặt phòng không tồn tại trên hệ thống.`);
    }
    return this.formatBooking(booking);
  }

  // ─── Cập nhật booking ────────────────────────────────────────────
  async update(bookingId: number, updateBookingDto: UpdateBookingDto) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: true },
    });
    if (!booking) {
      throw new NotFoundException(`Đơn đặt phòng không tồn tại trên hệ thống.`);
    }

    if (updateBookingDto.notes !== undefined) {
      booking.notes = updateBookingDto.notes;
    }

    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  // ─── Cập nhật status ─────────────────────────────────────────────
  async updateStatus(bookingId: number, status: BookingStatus) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${booking.status}" sang "${status}"`,
      );
    }

    if (status === BookingStatus.COMPLETED) {
      if (!booking.actualCheckIn) {
        throw new BadRequestException(
          'Booking chưa được check-in, không thể hoàn thành',
        );
      }
      if (!booking.actualCheckOut) {
        throw new BadRequestException(
          'Booking chưa được check-out, không thể hoàn thành',
        );
      }
    }

    booking.status = status;
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  // ─── Check-in thực tế ────────────────────────────────────────────
  async checkIn(bookingId: number, dto: CheckInDto) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Chỉ có thể check-in khi booking đã được xác nhận',
      );
    }
    if (booking.actualCheckIn) {
      throw new BadRequestException('Booking này đã được check-in trước đó');
    }

    const today = new Date().toISOString().slice(0, 10);
    if (today !== booking.checkInDate) {
      throw new BadRequestException(
        `Chỉ có thể check-in đúng ngày ${booking.checkInDate}`,
      );
    }

    // Lưu danh sách khách lưu trú
    const guests = this.bookingGuestRepository.create(
      dto.guests.map((g) => ({
        bookingId,
        fullName: g.fullName,
        idNumber: g.idNumber,
        phone: g.phone,
        nationality: g.nationality ?? 'Việt Nam',
        dateOfBirth: g.dateOfBirth,
      })),
    );
    await this.bookingGuestRepository.save(guests);

    // Cập nhật trạng thái phòng → OCCUPIED
    const roomIds = await this.bookingDetailRepository
      .find({ where: { bookingId }, select: ['roomId'] })
      .then((details) => details.map((d) => d.roomId));

    await this.roomRepository.update(roomIds, { status: RoomStatus.OCCUPIED });

    booking.actualCheckIn = new Date();
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  // ─── Check-out thực tế ───────────────────────────────────────────
  async checkOut(bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }
    if (!booking.actualCheckIn) {
      throw new BadRequestException(
        'Booking này chưa được check-in, không thể check-out',
      );
    }
    if (booking.actualCheckOut) {
      throw new BadRequestException('Booking này đã được check-out trước đó');
    }

    // Cập nhật trạng thái phòng → AVAILABLE
    const roomIds = await this.bookingDetailRepository
      .find({ where: { bookingId }, select: ['roomId'] })
      .then((details) => details.map((d) => d.roomId));

    await this.roomRepository.update(roomIds, { status: RoomStatus.AVAILABLE });

    booking.actualCheckOut = new Date();
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  async remove(bookingId: number) {
    const booking = await this.bookingRepository.find({ where: { bookingId } });
    if (!booking) {
      throw new NotFoundException('Đơn đặt phòng không tồn tại trên hệ thống.');
    }
    await this.bookingRepository.delete({ bookingId });
    return booking;
  }

  // ─── Tìm phòng trống + gợi ý tổ hợp ───────────────────────────
  async getAvailableRooms(query: AvailableRoomsQueryDto) {
    if (query.checkInDate >= query.checkOutDate) {
      throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng.');
    }

    const totalGuests = query.adults ?? 1;

    // 1. Lấy roomId đã bị đặt trong khoảng ngày
    const bookedDetails = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .where('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere('b.checkInDate < :checkOut', { checkOut: query.checkOutDate })
      .andWhere('b.checkOutDate > :checkIn', { checkIn: query.checkInDate })
      .select('bd.roomId')
      .getMany();

    const bookedRoomIds = bookedDetails.map((d) => d.roomId);

    // 2. Lấy tất cả phòng AVAILABLE (không filter maxOccupancy)
    const roomQuery = this.roomRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.roomType', 'rt')
      .leftJoinAndSelect('rt.roomTypeBed', 'rtb')
      .leftJoinAndSelect('rtb.roomBed', 'rb')
      .leftJoinAndSelect('rt.pricePlans', 'pp', 'pp.isActive = true')
      .where('r.status = :status', { status: RoomStatus.AVAILABLE });

    if (bookedRoomIds.length) {
      roomQuery.andWhere('r.roomId NOT IN (:...bookedRoomIds)', {
        bookedRoomIds,
      });
    }

    const rooms = await roomQuery.orderBy('rt.maxOccupancy', 'DESC').getMany();

    const formatted = rooms.map((r) => ({
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: {
        roomTypeId: r.roomType.roomTypeId,
        typeName: r.roomType.typeName,
        maxOccupancy: r.roomType.maxOccupancy,
        roomBeds: (r.roomType.roomTypeBed || []).map((rtb) => ({
          roomBedType: rtb.roomBed.roomBedType,
          capacity: rtb.roomBed.capacity,
          quantity: rtb.quantity,
        })),
        activePrice: this.resolvePrice(r.roomType.pricePlans),
      },
    }));

    // 3. Tìm tổ hợp tối ưu
    const combinations = this.findOptimalCombinations(formatted, totalGuests);

    return {
      totalGuests,
      availableRooms: formatted,
      combinations,
    };
  }

  private findOptimalCombinations(
    rooms: any[],
    totalGuests: number,
    maxCombinations = 50,
    maxRoomsPerCombination = 4,
  ): any[] {
    // Sort phòng: sức chứa giảm dần (greedy ưu tiên phòng lớn trước)
    const sorted = [...rooms].sort(
      (a, b) => b.roomType.maxOccupancy - a.roomType.maxOccupancy,
    );

    const results: any[][] = [];

    // BFS theo số phòng: 1 → 2 → 3 → 4
    for (
      let size = 1;
      size <= Math.min(maxRoomsPerCombination, sorted.length);
      size++
    ) {
      this.combinationsOfSize(sorted, size, (combo) => {
        const totalCapacity = combo.reduce(
          (s, r) => s + r.roomType.maxOccupancy,
          0,
        );
        if (totalCapacity >= totalGuests) {
          results.push(combo);
        }
        return results.length >= maxCombinations;
      });

      // Dừng ở level ít phòng nhất có tổ hợp hợp lệ
      if (results.length > 0) break;
    }

    // 4. Sort theo độ gần (tầng + số phòng), trả về tối đa maxCombinations
    return results
      .map((combo) => ({
        rooms: combo,
        totalCapacity: combo.reduce((s, r) => s + r.roomType.maxOccupancy, 0),
        proximityScore: this.calcProximityScore(combo),
      }))
      .sort((a, b) => a.proximityScore - b.proximityScore)
      .slice(0, maxCombinations);
  }

  // Duyệt tổ hợp C(n, size) với early exit
  private combinationsOfSize(
    arr: any[],
    size: number,
    callback: (combo: any[]) => boolean,
    start = 0,
    current: any[] = [],
  ): boolean {
    if (current.length === size) {
      return callback(current);
    }
    for (let i = start; i <= arr.length - (size - current.length); i++) {
      const shouldStop = this.combinationsOfSize(arr, size, callback, i + 1, [
        ...current,
        arr[i],
      ]);
      if (shouldStop) return true;
    }
    return false;
  }

  // Tính độ gần: tổng khoảng cách tầng + khoảng cách số phòng (trọng số nhỏ hơn)
  private calcProximityScore(combo: any[]): number {
    if (combo.length === 1) return 0;

    const extractNum = (s: string) => {
      const match = s.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    let score = 0;
    for (let i = 0; i < combo.length - 1; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        score += Math.abs(combo[i].floor - combo[j].floor) * 10;
        score += Math.abs(
          extractNum(combo[i].roomNumber) - extractNum(combo[j].roomNumber),
        );
      }
    }
    return score;
  }

  private resolvePrice(pricePlans: any[]): number | null {
    const active = pricePlans?.find((p) => p.isActive);
    return active ? Number(active.basePrice) : null;
  }

  // ─── Tính số đêm ────────────────────────────────────────────────
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const toVNDate = (date: Date) => {
      const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return new Date(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate(),
      );
    };
    const diffInMs = toVNDate(checkOut).getTime() - toVNDate(checkIn).getTime();
    const nights = diffInMs / (1000 * 60 * 60 * 24);
    return nights > 0 ? nights : 1;
  }

  // ─── Tính tổng tiền phòng theo từng đêm ─────────────────────────
  private async calcRoomTotal(
    roomTypeId: number,
    checkInDate: string,
    checkOutDate: string,
  ): Promise<number> {
    // Lấy tất cả plans của roomType
    const plans = await this.pricePlanRepository.find({
      where: { roomTypeId },
    });

    if (!plans.length) {
      throw new BadRequestException(
        `Loại phòng chưa có bảng giá. Vui lòng cập nhật bảng giá trước khi đặt phòng.`,
      );
    }

    const holidayPlans = plans.filter((p) => p.type === PricePlanType.HOLIDAY);
    const weekendPlan = plans.find((p) => p.type === PricePlanType.WEEKEND);
    const weekdayPlan = plans.find((p) => p.type === PricePlanType.WEEKDAY);

    if (!weekdayPlan) {
      throw new BadRequestException(
        `Loại phòng chưa có bảng giá ngày thường. Vui lòng cập nhật bảng giá.`,
      );
    }

    let total = 0;
    const current = new Date(checkInDate + 'T00:00:00');
    const end = new Date(checkOutDate + 'T00:00:00');

    while (current < end) {
      const dateStr = current.toISOString().slice(0, 10);
      const dayOfWeek = current.getDay();

      // Ưu tiên: HOLIDAY > WEEKEND > WEEKDAY
      const holiday = holidayPlans.find(
        (p) =>
          p.dateFrom &&
          p.dateTo &&
          p.dateFrom <= dateStr &&
          p.dateTo >= dateStr,
      );

      if (holiday) {
        total += Number(holiday.basePrice);
      } else if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendPlan) {
        total += Number(weekendPlan.basePrice);
      } else {
        total += Number(weekdayPlan.basePrice);
      }

      current.setDate(current.getDate() + 1);
    }

    return total;
  }

  // ─── Kiểm tra phòng trống ────────────────────────────────────────
  async checkRoomAvailability(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: number,
  ): Promise<boolean> {
    if (checkIn >= checkOut) {
      throw new BadRequestException('Ngày check-in phải trước ngày check-out');
    }

    const overlap = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .where('bd.roomId = :roomId', { roomId })
      .andWhere('b.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .andWhere('b.checkInDate < :checkOut', {
        checkOut: checkOut.toISOString().slice(0, 10),
      })
      .andWhere('b.checkOutDate > :checkIn', {
        checkIn: checkIn.toISOString().slice(0, 10),
      })
      .andWhere(
        excludeBookingId ? 'b.bookingId != :excludeBookingId' : '1=1',
        excludeBookingId ? { excludeBookingId } : {},
      )
      .getOne();

    return !overlap;
  }

  public async recalculateTotalAmount(bookingId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: {
        bookingDetails: {
          bookingServices: { service: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }

    let total = 0;
    for (const detail of booking.bookingDetails) {
      // priceAtBooking là tổng tiền phòng, không nhân nights nữa
      total += Number(detail.priceAtBooking);
      for (const bs of detail.bookingServices) {
        total += Number(bs.priceAtUsage) * bs.quantity;
      }
    }

    await this.bookingRepository.update(bookingId, { totalAmount: total });
  }

  // ─── Format response ─────────────────────────────────────────────
  private formatBooking(booking: Booking) {
    return {
      bookingId: booking.bookingId,
      status: booking.status,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      actualCheckIn: booking.actualCheckIn,
      actualCheckOut: booking.actualCheckOut,
      guests: (booking.guests || []).map((g) => ({
        bookingGuestId: g.bookingGuestId,
        fullName: g.fullName,
        idNumber: g.idNumber,
        phone: g.phone,
        nationality: g.nationality,
        dateOfBirth: g.dateOfBirth,
      })),
      totalAmount: booking.totalAmount,
      notes: booking.notes,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      vnpayTransactionId: booking.vnpayTransactionId,
      guestName: booking.guestName ?? null,
      guestPhone: booking.guestPhone ?? null,
      guestEmail: booking.guestEmail ?? null,
      customer: booking.customer
        ? {
            customerId: booking.customer.customerId,
            fullName: booking.customer.fullName,
            phone: booking.customer.phone,
            email: booking.customer.email,
            idNumber: booking.customer.idNumber,
          }
        : null,
      bookingDetails: (booking.bookingDetails || []).map((d) => ({
        bookingDetailId: d.bookingDetailId,
        priceAtBooking: d.priceAtBooking,
        room: d.room
          ? {
              roomId: d.room.roomId,
              roomNumber: d.room.roomNumber,
              floor: d.room.floor,
              status: d.room.status,
              roomType: d.room.roomType
                ? {
                    roomTypeId: d.room.roomType.roomTypeId,
                    typeName: d.room.roomType.typeName,
                    description: d.room.roomType.description,
                    maxOccupancy: d.room.roomType.maxOccupancy,
                    roomBeds: (d.room.roomType.roomTypeBed || []).map((b) => ({
                      roomBedId: b.roomBedId,
                      roomBedType: b.roomBed?.roomBedType,
                      capacity: b.roomBed?.capacity,
                      quantity: b.quantity,
                    })),
                    amenities: (d.room.roomType.roomTypeAmenities || []).map(
                      (a) => ({
                        roomAmenityId: a.roomAmenityId,
                        roomAmenityName: a.roomAmenity?.roomAmenityName,
                        category: a.roomAmenity?.category,
                      }),
                    ),
                    images: (d.room.roomType.roomImages || [])
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((img) => ({
                        roomImageId: img.roomImageId,
                        url: img.url,
                        altText: img.altText,
                        isCover: img.isCover,
                      })),
                    activePricePlan: (() => {
                      const active = (d.room.roomType.pricePlans || []).find(
                        (p) => p.isActive,
                      );
                      return active
                        ? {
                            pricePlanId: active.pricePlanId,
                            pricePlanName: active.pricePlanName,
                            type: active.type,
                            basePrice: active.basePrice,
                          }
                        : null;
                    })(),
                  }
                : null,
            }
          : null,
        services: (d.bookingServices || []).map((bs) => ({
          bookingServiceId: bs.bookingServiceId,
          quantity: bs.quantity,
          priceAtUsage: bs.priceAtUsage,
          service: bs.service
            ? {
                serviceId: bs.service.serviceId,
                serviceName: bs.service.serviceName,
                unit: bs.service.unit,
              }
            : null,
        })),
      })),
      createdAt: booking.created_At,
      updatedAt: booking.updated_At,
    };
  }
}
