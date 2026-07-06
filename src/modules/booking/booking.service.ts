import Decimal from 'decimal.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { DataSource, Repository, LessThan, IsNull, Not } from 'typeorm';
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
import { RoomHoldService } from '../room_hold/room_hold.service';
import { HousekeepingService } from '../housekeeping_task/housekeeping_task.service';
import { CustomerService } from '../customer/customer.service';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import {
  calculateNights,
  findOptimalCombinations,
  formatBooking,
  resolvePrice,
} from './booking.helpers';
import { BookingsQueryDto } from './dto/bookings-query.dto';
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
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
    private readonly roomHoldService: RoomHoldService,
    private readonly housekeepingService: HousekeepingService,
    private readonly customerService: CustomerService,
    private readonly dataSource: DataSource,
  ) {}
  async create(createBookingDto: CreateBookingDto) {
    const roomIds = createBookingDto.bookingDetails.map((d) => d.roomId);
    const isValid = await this.roomHoldService.isValidSession(
      createBookingDto.sessionId,
      roomIds,
      createBookingDto.checkInDate,
      createBookingDto.checkOutDate,
    );
    if (!isValid) {
      throw new ConflictException(
        'Phiên giữ phòng đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại phòng.',
      );
    }
    if (!createBookingDto.customerId) {
      if (!createBookingDto.guestName) {
        throw new BadRequestException('Tên khách không được để trống');
      }
      if (!createBookingDto.guestEmail) {
        throw new BadRequestException('Email không được để trống.');
      }
      const existingCustomer = await this.customerService.findByEmail(
        createBookingDto.guestEmail,
      );
      if (existingCustomer) {
        createBookingDto.customerId = existingCustomer.customerId;
      } else {
        const newCustomer = await this.customerService.create({
          fullName: createBookingDto.guestName,
          email: createBookingDto.guestEmail,
          phone: createBookingDto.guestPhone,
        });
        createBookingDto.customerId = newCustomer.customerId;
      }
    }
    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);
    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'Ngày nhận phòng phải trước ngày trả phòng.',
      );
    }
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
        const priceAtBooking = await this.calcRoomTotal(
          room.roomTypeId,
          createBookingDto.checkInDate,
          createBookingDto.checkOutDate,
        );
        totalAmount += priceAtBooking;
        let bookingServices: any[] = [];
        let serviceAmount = 0;
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
              serviceAmount += priceAtUsage;
              return {
                serviceId: s.serviceId,
                serviceName: service.serviceName,
                unit: service.unit,
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
          maxOccupancy: room.roomType.maxOccupancy,
          serviceAmount,
        };
      }),
    );
    const saved = await this.dataSource.transaction(async (manager) => {
      for (const item of createBookingDto.bookingDetails) {
        const overlap = await manager
          .createQueryBuilder(BookingDetail, 'bd')
          .innerJoin('bd.booking', 'b')
          .where('bd.roomId = :roomId', { roomId: item.roomId })
          .andWhere('b.status != :cancelled', {
            cancelled: BookingStatus.CANCELLED,
          })
          .andWhere('b.checkInDate < :checkOut', {
            checkOut: createBookingDto.checkOutDate,
          })
          .andWhere('b.checkOutDate > :checkIn', {
            checkIn: createBookingDto.checkInDate,
          })
          .getOne();
        if (overlap) {
          const room = await manager.findOne(Room, {
            where: { roomId: item.roomId },
          });
          throw new ConflictException(
            `Phòng '${room?.roomNumber ?? item.roomId}' vừa được đặt bởi người khác. Vui lòng chọn lại.`,
          );
        }
      }
      const booking = manager.create(Booking, {
        customerId: createBookingDto.customerId,
        guestName: createBookingDto.guestName ?? null,
        guestPhone: createBookingDto.guestPhone ?? null,
        guestEmail: createBookingDto.guestEmail ?? null,
        checkInDate: createBookingDto.checkInDate,
        checkOutDate: createBookingDto.checkOutDate,
        notes: createBookingDto.notes,
        totalAmount,
        serviceAmount: bookingDetails.reduce(
          (s, d) => s + (d.serviceAmount ?? 0),
          0,
        ),
        status: BookingStatus.PENDING,
        bookingDetails: bookingDetails.map(
          ({ maxOccupancy, serviceAmount: _sa, ...d }) => d,
        ),
      } as any);
      return manager.save(Booking, booking as any);
    });
    await this.roomHoldService.release(createBookingDto.sessionId);
    const result = await this.bookingById(
      Array.isArray(saved) ? saved[0].bookingId : saved.bookingId,
    );
    this.mailService.sendBookingConfirmation(result as any).catch(() => {});
    return result;
  }

  async bookings(bookingsQueryDto: BookingsQueryDto) {
    const [bookings, totalRecords] = await this.bookingRepository.findAndCount({
      relations: {
        customer: { user: true },
        guests: true,
        bookingDetails: {
          room: {
            roomType: {
              roomTypeBed: { roomBed: true },
              roomImages: true,
              pricePlans: true,
            },
          },
          bookingServices: true,
        },
      },
      order: { created_At: 'DESC' },
      take: Number(bookingsQueryDto.limit),
      skip:
        (Number(bookingsQueryDto.page) - 1) * Number(bookingsQueryDto.limit),
    });

    const totalPage = Math.ceil(totalRecords / Number(bookingsQueryDto.limit));

    return {
      data: bookings.map((b) => formatBooking(b)),
      totalPage,
    };
  }

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
              pricePlans: true,
            },
          },
          bookingServices: true,
        },
      },
    });
    if (!booking) {
      throw new NotFoundException(`Đơn đặt phòng không tồn tại trên hệ thống.`);
    }
    return formatBooking(booking);
  }

  async bookingByCustomerId(customerId: number) {
    const bookings = await this.bookingRepository.find({
      where: { customerId },
      relations: {
        customer: true,
        guests: true,
        bookingDetails: {
          room: {
            roomType: {
              roomTypeBed: { roomBed: true },
              roomImages: true,
              pricePlans: true,
            },
          },
          bookingServices: true,
        },
      },
      order: { created_At: 'DESC' },
    });
    return bookings.map((b) => formatBooking(b));
  }

  async bookingByUserId(userId: number) {
    const bookings = await this.bookingRepository.find({
      where: {
        customer: {
          user: {
            id: userId,
          },
        },
      },
      relations: {
        customer: { user: true },
        guests: true,
        bookingDetails: {
          room: {
            roomType: {
              roomTypeBed: { roomBed: true },
              roomImages: true,
              pricePlans: true,
            },
          },
          bookingServices: true,
        },
      },
      order: { created_At: 'DESC' },
    });
    return bookings.map((b) => formatBooking(b));
  }

  async cancelBookingByUser(bookingId: number, userId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { customer: { user: true } },
    });
    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt phòng.`);
    }
    if (
      !booking.customer ||
      !booking.customer.user ||
      booking.customer.user.id !== userId
    ) {
      throw new BadRequestException(
        'Bạn không có quyền hủy đơn đặt phòng này.',
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn đặt phòng chưa được xác nhận.',
      );
    }
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Không thể hủy đơn đặt phòng đã thanh toán.',
      );
    }
    booking.status = BookingStatus.CANCELLED;
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  async update(bookingId: number, updateBookingDto: UpdateBookingDto) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: { bookingServices: true } },
    });
    if (!booking) {
      throw new NotFoundException(`Đơn đặt phòng không tồn tại trên hệ thống.`);
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn đặt phòng đã hoàn thành không thể chỉnh sửa.',
      );
    }
    if (updateBookingDto.notes !== undefined) {
      booking.notes = updateBookingDto.notes;
    }
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  async updateStatus(bookingId: number, status: BookingStatus) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt phòng.`);
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn đặt phòng đã hoàn thành không thể chỉnh sửa.',
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
    if (status === BookingStatus.CANCELLED) {
      if (booking.actualCheckIn) {
        throw new BadRequestException('Không thể hủy đơn đã nhận phòng.');
      }
      if (booking.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException('Không thể hủy đơn đã thanh toán.');
      }
    }
    if (status === BookingStatus.COMPLETED) {
      if (!booking.actualCheckIn) {
        throw new BadRequestException('Chưa nhận phòng không thể hoàn thành');
      }
      if (!booking.actualCheckOut) {
        throw new BadRequestException('Chưa trả phòng không thể hoàn thành');
      }
    }
    booking.status = status;
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  async checkIn(bookingId: number, dto: CheckInDto) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: { room: { roomType: true } } },
    });
    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt phòng.`);
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn đặt phòng đã hoàn thành không thể chỉnh sửa.',
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Đơn chưa xác nhận không thể nhận phòng.');
    }
    if (booking.actualCheckIn) {
      throw new BadRequestException('Đã nhận phòng trước đó');
    }
    const now = new Date();
    const today = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    if (today < booking.checkInDate || today > booking.checkOutDate) {
      throw new BadRequestException(
        `Chỉ có thể nhận phòng trong khoảng từ ngày ${booking.checkInDate} đến ${booking.checkOutDate}.`,
      );
    }
    const totalCapacity = booking.bookingDetails.reduce(
      (s, d) => s + (d.room?.roomType?.maxOccupancy ?? 0),
      0,
    );
    if (dto.guests.length > totalCapacity) {
      throw new BadRequestException(
        `Số khách thực tế (${dto.guests.length}) vượt quá sức chứa phòng (${totalCapacity}).`,
      );
    }
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
    const roomIds = await this.bookingDetailRepository
      .find({ where: { bookingId }, select: ['roomId'] })
      .then((details) => details.map((d) => d.roomId));
    await this.roomRepository.update(roomIds, { status: RoomStatus.OCCUPIED });
    booking.actualCheckIn = new Date();
    const saved = await this.bookingRepository.save(booking);
    return this.bookingById(saved.bookingId);
  }

  async checkOut(bookingId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt phòng`);
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn đặt phòng đã hoàn thành không thể chỉnh sửa.',
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Đơn chưa xác nhận không thể nhận phòng.');
    }
    if (!booking.actualCheckIn) {
      throw new BadRequestException('Phải nhận phòng trước khi trả phòng.');
    }
    if (
      booking.serviceAmount > 0 &&
      booking.servicePaymentStatus === PaymentStatus.UNPAID
    ) {
      throw new BadRequestException(
        'Cần thanh toán dịch vụ trước khi trả phòng.',
      );
    }
    if (booking.actualCheckOut) {
      throw new BadRequestException('Đã trả phòng trước đó.');
    }
    const roomIds = await this.bookingDetailRepository
      .find({ where: { bookingId }, select: ['roomId'] })
      .then((details) => details.map((d) => d.roomId));
    await this.roomRepository.update(roomIds, { status: RoomStatus.CLEANING });
    booking.actualCheckOut = new Date();
    booking.status = BookingStatus.COMPLETED;
    const saved = await this.bookingRepository.save(booking);
    await Promise.all(
      roomIds.map((id) => this.housekeepingService.createTask(id)),
    );
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

  async getAvailableRooms(query: AvailableRoomsQueryDto) {
    if (query.checkInDate >= query.checkOutDate) {
      throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng.');
    }
    const adults = query.adults ?? 1;
    const children = query.children ?? 0;
    const totalGuests = adults + Math.ceil(children / 2);
    const bookedDetails = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .where('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere('b.checkInDate < :checkOut', { checkOut: query.checkOutDate })
      .andWhere('b.checkOutDate > :checkIn', { checkIn: query.checkInDate })
      .select('bd.roomId')
      .getMany();
    const bookedRoomIds = bookedDetails.map((d) => d.roomId);
    const heldRoomIds = await this.roomHoldService.getHeldRoomIds(
      query.checkInDate,
      query.checkOutDate,
    );
    const excludedRoomIds = [...new Set([...bookedRoomIds, ...heldRoomIds])];
    const roomQuery = this.roomRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.roomType', 'rt')
      .leftJoinAndSelect('rt.roomTypeBed', 'rtb')
      .leftJoinAndSelect('rtb.roomBed', 'rb')
      .leftJoinAndSelect('rt.pricePlans', 'pp', 'pp.isActive = true')
      .leftJoinAndSelect('rt.roomImages', 'ri')
      .leftJoinAndSelect('rt.roomTypeAmenities', 'rta')
      .leftJoinAndSelect('rta.roomAmenity', 'ram')
      .where('r.status != :maintenance', {
        maintenance: RoomStatus.MAINTENANCE,
      });
    if (excludedRoomIds.length) {
      roomQuery.andWhere('r.roomId NOT IN (:...bookedRoomIds)', {
        bookedRoomIds: excludedRoomIds,
      });
    }
    const rooms = await roomQuery.getMany();
    const formatted = await Promise.all(
      rooms.map(async (r) => {
        let activePrice = 0;
        try {
          const totalPrice = await this.calcRoomTotal(
            r.roomType.roomTypeId,
            query.checkInDate,
            query.checkOutDate,
          );
          const nights = Math.max(
            1,
            Math.round(
              (new Date(query.checkOutDate + 'T00:00:00').getTime() -
                new Date(query.checkInDate + 'T00:00:00').getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );
          activePrice = totalPrice / nights;
        } catch (err) {
          const fallback = resolvePrice(r.roomType.pricePlans);
          activePrice = fallback ?? 0;
        }
        return {
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
            activePrice,
            roomImages: (r.roomType.roomImages || []).map((img) => ({
              roomImageId: img.roomImageId,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder,
              isCover: img.isCover,
            })),
            roomTypeAmenities: (r.roomType.roomTypeAmenities || []).map(
              (amenity) => ({
                roomAmenityId: amenity.roomAmenityId,
                category: amenity.roomAmenity.category,
                roomAmenityName: amenity.roomAmenity.roomAmenityName,
              }),
            ),
          },
        };
      }),
    );

    const sorted = formatted.sort((a, b) => {
      const excessA = a.roomType.maxOccupancy - totalGuests;
      const excessB = b.roomType.maxOccupancy - totalGuests;
      const scoreA = excessA >= 0 ? excessA : Infinity;
      const scoreB = excessB >= 0 ? excessB : Infinity;
      if (scoreA !== scoreB) return scoreA - scoreB;

      if (a.roomType.activePrice !== b.roomType.activePrice)
        return a.roomType.activePrice - b.roomType.activePrice;

      return a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
      });
    });

    const combinations = findOptimalCombinations(formatted, totalGuests);
    return {
      totalGuests,
      availableRooms: sorted,
      combinations,
    };
  }

  private async calcRoomTotal(
    roomTypeId: number,
    checkInDate: string,
    checkOutDate: string,
  ): Promise<number> {
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
    let total = new Decimal(0);
    const current = new Date(checkInDate + 'T00:00:00');
    const end = new Date(checkOutDate + 'T00:00:00');
    while (current < end) {
      const dateStr = current.toISOString().slice(0, 10);
      const dayOfWeek = current.getDay();
      const holiday = holidayPlans.find(
        (p) =>
          p.dateFrom &&
          p.dateTo &&
          p.dateFrom <= dateStr &&
          p.dateTo >= dateStr,
      );
      if (holiday) {
        total = total.plus(new Decimal(String(holiday.basePrice)));
      } else if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendPlan) {
        total = total.plus(new Decimal(String(weekendPlan.basePrice)));
      } else {
        total = total.plus(new Decimal(String(weekdayPlan.basePrice)));
      }
      current.setDate(current.getDate() + 1);
    }
    return total.toNumber();
  }

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

  async markRoomAvailable(roomId: number) {
    const room = await this.roomRepository.findOne({ where: { roomId } });
    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng.`);
    }
    if (room.status !== RoomStatus.CLEANING) {
      throw new BadRequestException(
        `Phòng không ở trạng thái CLEANING (hiện tại: ${room.status}).`,
      );
    }
    await this.roomRepository.update(roomId, { status: RoomStatus.AVAILABLE });
    return { roomId, status: RoomStatus.AVAILABLE };
  }

  public async recalculateTotalAmount(bookingId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: { bookingServices: true } },
    });
    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }
    let total = new Decimal(0);
    for (const detail of booking.bookingDetails) {
      total = total.plus(new Decimal(String(detail.priceAtBooking)));
    }
    await this.bookingRepository.update(bookingId, {
      totalAmount: total.toNumber(),
    });
  }

  public async recalculateServiceAmount(bookingId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: { bookingDetails: { bookingServices: true } },
    });
    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy booking có ID "${bookingId}"`,
      );
    }
    let serviceTotal = new Decimal(0);
    for (const detail of booking.bookingDetails) {
      for (const bs of detail.bookingServices) {
        serviceTotal = serviceTotal.plus(
          new Decimal(String(bs.priceAtUsage)).mul(bs.quantity),
        );
      }
    }
    await this.bookingRepository.update(bookingId, {
      serviceAmount: serviceTotal.toNumber(),
    });
  }

  async autoCompleteExpiredBookings(today: string) {
    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        checkOutDate: LessThan(today),
        paymentStatus: PaymentStatus.PAID,
      },
      relations: { bookingDetails: true },
    });
    if (!expiredBookings.length) return;
    for (const booking of expiredBookings) {
      if (
        booking.serviceAmount > 0 &&
        booking.servicePaymentStatus === PaymentStatus.UNPAID
      ) {
        continue;
      }
      try {
        if (booking.actualCheckIn && !booking.actualCheckOut) {
          const roomIds = booking.bookingDetails.map((d) => d.roomId);
          if (roomIds.length) {
            await this.roomRepository.update(roomIds, {
              status: RoomStatus.CLEANING,
            });
            await Promise.all(
              roomIds.map((id) => this.housekeepingService.createTask(id)),
            );
          }
          booking.actualCheckOut = new Date();
        }
        booking.status = BookingStatus.COMPLETED;
        await this.bookingRepository.save(booking);
        this.logger.log(
          `Tự động hoàn thành đơn đặt phòng #${booking.bookingId} do quá ngày trả phòng và đã thanh toán đầy đủ (Check-in: ${booking.actualCheckIn ? 'Đã nhận phòng' : 'Chưa nhận phòng'}).`,
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi tự động hoàn thành đơn đặt phòng #${booking.bookingId}: ${err}`,
        );
      }
    }
  }
}
