import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { Room } from '../../entities/room.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { RoomStatus } from '../../common/enums/room-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import {
  HousekeepingTask,
  HousekeepingTaskStatus,
} from '../../entities/housekeeping-task.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(HousekeepingTask)
    private readonly housekeepingTaskRepository: Repository<HousekeepingTask>,
  ) {}

  async getSummary() {
    const now = new Date();
    const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = localNow.toISOString().slice(0, 10);
    const firstDayOfMonth = `${localNow.getUTCFullYear()}-${String(localNow.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const firstDayOfYear = `${localNow.getUTCFullYear()}-01-01`;

    const yesterday = new Date(localNow.getTime());
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const currentDay = localNow.getUTCDay(); // 0: Chủ nhật, 1: Thứ 2, ...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(localNow.getTime());
    monday.setUTCDate(monday.getUTCDate() + diffToMonday);
    const mondayStr = monday.toISOString().slice(0, 10);

    const [
      revenueToday,
      revenueYesterday,
      revenueWeek,
      revenueMonth,
      revenueYear,
      roomStats,
      bookingStats,
      newBookingsToday,
      occupancyData,
      occupancyYesterday,
      arrivalsToday,
      departuresToday,
      overdueCheckouts,
      unpaidBookings,
      urgentHousekeepingTasks,
      roomMap,
      forecast14Days,
      recentActivity,
    ] = await Promise.all([
      this.sumRevenue(todayStr, todayStr),
      this.sumRevenue(yesterdayStr, yesterdayStr),
      this.sumRevenue(mondayStr, todayStr),
      this.sumRevenue(firstDayOfMonth, todayStr),
      this.sumRevenue(firstDayOfYear, todayStr),
      this.getRoomStats(),
      this.getBookingStats(),
      this.countNewBookingsToday(todayStr),
      this.getOccupancyRate(todayStr),
      this.getOccupancyRate(yesterdayStr),
      this.getArrivalsToday(todayStr),
      this.getDeparturesToday(todayStr),
      this.getOverdueCheckouts(todayStr),
      this.getUnpaidBookings(todayStr),
      this.getUrgentHousekeepingTasks(todayStr),
      this.getRoomMap(todayStr),
      this.getForecast14Days(todayStr),
      this.getRecentActivity(),
    ]);

    return {
      revenue: {
        today: revenueToday,
        todayVsYesterday: this.calcDelta(revenueToday, revenueYesterday),
        thisWeek: revenueWeek,
        thisMonth: revenueMonth,
        thisYear: revenueYear,
      },
      rooms: roomStats,
      bookings: {
        byStatus: bookingStats,
        newToday: newBookingsToday,
      },
      occupancyRate: {
        ...occupancyData,
        yesterdayRate: occupancyYesterday.rate,
        delta: occupancyData.rate - occupancyYesterday.rate,
      },
      operations: {
        arrivalsToday,
        departuresToday,
        overdueCheckouts,
        unpaidBookings,
        urgentHousekeepingTasks,
      },
      roomMap,
      forecast14Days,
      recentActivity,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private calcDelta(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private dateAdd(base: string, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // ── Existing methods (unchanged) ──────────────────────────────────────────

  private async sumRevenue(from: string, to: string): Promise<number> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Thực hiện tính tổng cột 'totalAmount'. Dùng COALESCE để trả về 0 nếu kết quả SUM bị null
    // Bộ lọc: chỉ lấy những đơn đặt phòng đã hoàn thành (COMPLETED) và check-in trong khoảng từ ngày 'from' đến 'to'
    const result = await this.bookingRepository
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.totalAmount), 0)', 'total')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from })
      .andWhere('b.checkInDate <= :to', { to })
      .getRawOne();

    return Number(result.total);
  }

  private async getRoomStats(): Promise<Record<RoomStatus, number>> {
    // Khởi tạo truy vấn trên bảng Room 'r'
    // Select cột 'status' và đếm số lượng phòng tương ứng với từng status (COUNT(*))
    // Gom nhóm kết quả theo status (GROUP BY) để lấy thống kê tổng số phòng theo từng trạng thái
    const rows = await this.roomRepository
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    const stats: Record<string, number> = {
      [RoomStatus.AVAILABLE]: 0,
      [RoomStatus.OCCUPIED]: 0,
      [RoomStatus.CLEANING]: 0,
      [RoomStatus.MAINTENANCE]: 0,
    };

    for (const row of rows) {
      stats[row.status] = Number(row.count);
    }

    return stats as Record<RoomStatus, number>;
  }

  private async getBookingStats(): Promise<Record<BookingStatus, number>> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Thống kê số lượng đơn đặt phòng theo từng trạng thái bằng cách gom nhóm (GROUP BY b.status) và đếm COUNT(*)
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.status')
      .getRawMany();

    const stats: Record<string, number> = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.COMPLETED]: 0,
      [BookingStatus.CANCELLED]: 0,
    };

    for (const row of rows) {
      stats[row.status] = Number(row.count);
    }

    return stats as Record<BookingStatus, number>;
  }

  private async countNewBookingsToday(todayStr: string): Promise<number> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Bộ lọc: Chuyển đổi datetime 'created_At' sang ngày (DATE) để so sánh với ngày hôm nay 'todayStr'
    // Trả về tổng số lượng bản ghi (COUNT) thỏa mãn điều kiện
    return this.bookingRepository
      .createQueryBuilder('b')
      .where('DATE(b.created_At) = :today', { today: todayStr })
      .getCount();
  }

  private async getOccupancyRate(
    dateStr: string,
  ): Promise<{ occupied: number; total: number; rate: number }> {
    const [occupied, total] = await Promise.all([
      this.bookingRepository
        .createQueryBuilder('b')
        .innerJoin('b.bookingDetails', 'bd')
        .where('b.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        })
        .andWhere('b.checkInDate <= :date', { date: dateStr })
        .andWhere('b.checkOutDate > :date', { date: dateStr })
        .select('COUNT(DISTINCT bd.roomId)', 'count')
        .getRawOne()
        .then((r) => Number(r.count)),
      this.roomRepository.count(),
    ]);

    return {
      occupied,
      total,
      rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }

  private async getArrivalsToday(todayStr: string): Promise<number> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Bộ lọc: Tìm các đơn có checkInDate bằng hôm nay và không bị HỦY (status != CANCELLED)
    // Trả về tổng số lượt check-in dự kiến hôm nay
    return this.bookingRepository
      .createQueryBuilder('b')
      .where('b.checkInDate = :today', { today: todayStr })
      .andWhere('b.status != :status', { status: BookingStatus.CANCELLED })
      .getCount();
  }

  private async getDeparturesToday(todayStr: string): Promise<number> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Bộ lọc: Tìm các đơn có checkOutDate bằng hôm nay và không bị HỦY
    // Trả về tổng số lượt check-out dự kiến hôm nay
    return this.bookingRepository
      .createQueryBuilder('b')
      .where('b.checkOutDate = :today', { today: todayStr })
      .andWhere('b.status != :status', { status: BookingStatus.CANCELLED })
      .getCount();
  }

  private async getUnpaidBookings(todayStr: string): Promise<any[]> {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Left Join với bảng Customer 'c' để lấy tên khách hàng liên quan
    // Bộ lọc:
    // - Trạng thái thanh toán là CHƯA THANH TOÁN (paymentStatus = UNPAID)
    // - Đơn hàng không bị HỦY (status != CANCELLED)
    // - Ngày check-in nhỏ hơn hoặc bằng ngày hôm nay (đã hoặc đang ở nhưng chưa thanh toán)
    // Chỉ select các trường cần thiết để tối ưu hóa dữ liệu trả về
    return this.bookingRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'c')
      .where('b.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.UNPAID,
      })
      .andWhere('b.status != :status', { status: BookingStatus.CANCELLED })
      .andWhere('b.checkInDate <= :today', { today: todayStr })
      .select([
        'b.bookingId',
        'b.guestName',
        'b.totalAmount',
        'b.checkInDate',
        'c.fullName',
      ])
      .getMany();
  }

  private async getUrgentHousekeepingTasks(todayStr: string): Promise<any[]> {
    // Khởi tạo truy vấn trên bảng HousekeepingTask 'hk'
    // Join với bảng Room 'r' để biết số phòng cần dọn dẹp
    // Bộ lọc: nhiệm vụ dọn dẹp chưa làm (PENDING) và được tạo ngày hôm nay (createdAt)
    // Select ID nhiệm vụ, ngày tạo, và số phòng tương ứng
    return this.housekeepingTaskRepository
      .createQueryBuilder('hk')
      .leftJoinAndSelect('hk.room', 'r')
      .where('hk.status = :status', { status: HousekeepingTaskStatus.PENDING })
      .andWhere('DATE(hk.createdAt) = :today', { today: todayStr })
      .select(['hk.id', 'hk.createdAt', 'r.roomNumber'])
      .getMany();
  }

  // ── New methods ───────────────────────────────────────────────────────────

  /**
   * Room map: toàn bộ phòng theo tầng, kèm trạng thái + thông tin khách đang ở.
   * Tầng được parse từ roomNumber: "101" → floor 1, "215" → floor 2, v.v.
   */
  private async getRoomMap(todayStr: string): Promise<{
    floors: {
      floor: number;
      rooms: {
        roomId: number;
        roomNumber: string;
        status: RoomStatus;
        roomTypeName: string;
        // chỉ có khi status = OCCUPIED hoặc RESERVED
        guestName?: string;
        checkOutDate?: string;
        bookingId?: number;
        note?: string;
      }[];
    }[];
  }> {
    // Lấy tất cả phòng kèm roomType
    // Khởi tạo truy vấn trên bảng Room 'r'
    // Join với loại phòng 'rt'
    // Chỉ select các thông tin cơ bản của phòng và tên loại phòng, sắp xếp theo số phòng tăng dần
    const rooms = await this.roomRepository
      .createQueryBuilder('r')
      .leftJoin('r.roomType', 'rt')
      .select(['r.roomId', 'r.roomNumber', 'r.status', 'rt.typeName'])
      .orderBy('r.roomNumber', 'ASC')
      .getMany();

    // Lấy các booking đang active hôm nay (CONFIRMED, check-in <= today < check-out)
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Join với chi tiết đặt phòng 'bd'
    // Bộ lọc: Tìm các đơn hàng đã xác nhận (CONFIRMED) đang ở (check-in <= hôm nay < check-out)
    // Chỉ select các cột cần thiết để biết khách nào đang ở phòng nào hôm nay
    const activeBookings = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.bookingDetails', 'bd')
      .where('b.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('b.checkInDate <= :today', { today: todayStr })
      .andWhere('b.checkOutDate > :today', { today: todayStr })
      .select([
        'b.bookingId',
        'b.guestName',
        'b.checkOutDate',
        'b.notes',
        'bd.roomId',
      ])
      .getMany();

    // Lấy booking PENDING (đặt trước chưa check-in) hôm nay
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Join với chi tiết đặt phòng 'bd'
    // Bộ lọc: Tìm các đơn hàng PENDING có ngày check-in chính là hôm nay (đặt trước sắp đến nhận phòng)
    const pendingBookings = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.bookingDetails', 'bd')
      .where('b.status = :status', { status: BookingStatus.PENDING })
      .andWhere('b.checkInDate = :today', { today: todayStr })
      .select(['b.bookingId', 'b.guestName', 'b.checkOutDate', 'bd.roomId'])
      .getMany();

    // Build map roomId → booking info
    const occupiedMap = new Map<
      number,
      {
        guestName: string;
        checkOutDate: string;
        bookingId: number;
        note?: string;
      }
    >();
    for (const b of activeBookings) {
      for (const bd of (b as any).bookingDetails ?? []) {
        occupiedMap.set(bd.roomId, {
          guestName: b.guestName,
          checkOutDate: b.checkOutDate,
          bookingId: b.bookingId,
          note: b.notes,
        });
      }
    }

    const reservedMap = new Map<
      number,
      { guestName: string; checkOutDate: string; bookingId: number }
    >();
    for (const b of pendingBookings) {
      for (const bd of (b as any).bookingDetails ?? []) {
        reservedMap.set(bd.roomId, {
          guestName: b.guestName,
          checkOutDate: b.checkOutDate,
          bookingId: b.bookingId,
        });
      }
    }

    // Group theo tầng
    const floorMap = new Map<number, any[]>();
    for (const room of rooms) {
      const floor = Math.floor(Number(room.roomNumber) / 100);
      if (!floorMap.has(floor)) floorMap.set(floor, []);

      const entry: any = {
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        status: room.status,
        roomTypeName: (room as any).roomType?.typeName ?? '',
      };

      if (occupiedMap.has(room.roomId)) {
        Object.assign(entry, occupiedMap.get(room.roomId));
      } else if (reservedMap.has(room.roomId)) {
        const info = reservedMap.get(room.roomId)!;
        Object.assign(entry, info);
        entry.status = 'reserved'; // virtual status for FE
      }

      floorMap.get(floor)!.push(entry);
    }

    const floors = Array.from(floorMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, rooms]) => ({ floor, rooms }));

    return { floors };
  }

  /**
   * Forecast 14 ngày tới: mỗi ngày trả về % confirmed + % pending.
   */
  private async getForecast14Days(todayStr: string): Promise<
    {
      date: string;
      confirmedRate: number;
      pendingRate: number;
      totalRooms: number;
    }[]
  > {
    const totalRooms = await this.roomRepository.count();
    if (totalRooms === 0) return [];

    const dates = Array.from({ length: 14 }, (_, i) =>
      this.dateAdd(todayStr, i + 1),
    );
    const endDate = dates[dates.length - 1];

    // Một query lấy tất cả booking trong window, group by date + status
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Join với chi tiết đặt phòng 'bd'
    // Chọn cột ngày check-in, trạng thái đơn và đếm số lượng roomId duy nhất cho ngày đó
    // Bộ lọc: Chỉ lấy đơn CONFIRMED hoặc PENDING trong khoảng 14 ngày tới
    // Gom nhóm theo ngày check-in và theo trạng thái (status) để ra báo cáo số phòng dự kiến/đã cọc theo từng ngày
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.bookingDetails', 'bd')
      .select('b.checkInDate', 'date')
      .addSelect('b.status', 'status')
      .addSelect('COUNT(DISTINCT bd.roomId)', 'rooms')
      .where('b.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      })
      .andWhere('b.checkInDate >= :start', { start: dates[0] })
      .andWhere('b.checkInDate <= :end', { end: endDate })
      .groupBy('b.checkInDate')
      .addGroupBy('b.status')
      .getRawMany();

    // Build map date → { confirmed, pending }
    const map = new Map<string, { confirmed: number; pending: number }>();
    for (const row of rows) {
      const key =
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10);
      if (!map.has(key)) map.set(key, { confirmed: 0, pending: 0 });
      const entry = map.get(key)!;
      if (row.status === BookingStatus.CONFIRMED)
        entry.confirmed += Number(row.rooms);
      if (row.status === BookingStatus.PENDING)
        entry.pending += Number(row.rooms);
    }

    return dates.map((date) => {
      const entry = map.get(date) ?? { confirmed: 0, pending: 0 };
      return {
        date,
        confirmedRate: Math.min(
          Math.round((entry.confirmed / totalRooms) * 100),
          100,
        ),
        pendingRate: Math.min(
          Math.round((entry.pending / totalRooms) * 100),
          100,
        ),
        totalRooms,
      };
    });
  }

  /**
   * Phòng quá giờ check-out (checkOutDate < today và vẫn CONFIRMED).
   */
  private async getOverdueCheckouts(todayStr: string): Promise<
    {
      bookingId: number;
      guestName: string;
      checkOutDate: string;
      roomNumbers: string[];
    }[]
  > {
    // Khởi tạo truy vấn trên bảng Booking 'b'
    // Join với chi tiết đặt phòng 'bd' và thực thể phòng 'r'
    // Bộ lọc: Đơn hàng vẫn ở trạng thái CONFIRMED (đã check-in) nhưng ngày checkOutDate nhỏ hơn hôm nay (chưa check-out đúng hạn)
    // Select các trường cần hiển thị cảnh báo quá hạn
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.bookingDetails', 'bd')
      .innerJoin('bd.room', 'r')
      .where('b.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('b.checkOutDate < :today', { today: todayStr })
      .select(['b.bookingId', 'b.guestName', 'b.checkOutDate', 'r.roomNumber'])
      .getMany();

    // Group by bookingId
    const grouped = new Map<number, any>();
    for (const row of rows) {
      if (!grouped.has(row.bookingId)) {
        grouped.set(row.bookingId, {
          bookingId: row.bookingId,
          guestName: row.guestName,
          checkOutDate: row.checkOutDate,
          roomNumbers: [],
        });
      }
      for (const bd of (row as any).bookingDetails ?? []) {
        grouped.get(row.bookingId).roomNumbers.push(bd.room?.roomNumber);
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * 20 hoạt động gần nhất: check-in, check-out, đặt phòng mới, thanh toán.
   * Merge từ nhiều nguồn, sort theo thời gian.
   */
  private async getRecentActivity(): Promise<
    { type: string; description: string; time: Date; bookingId?: number }[]
  > {
    const [newBookings, checkIns, checkOuts] = await Promise.all([
      // Khởi tạo truy vấn lấy danh sách Đặt phòng mới được tạo trong vòng 24 giờ qua
      this.bookingRepository
        .createQueryBuilder('b')
        .select(['b.bookingId', 'b.guestName', 'b.created_At'])
        .where('b.created_At >= DATE_SUB(NOW(), INTERVAL 24 HOUR)')
        .orderBy('b.created_At', 'DESC')
        .limit(10)
        .getMany(),

      // Khởi tạo truy vấn lấy danh sách khách đã Check-in hôm nay
      this.bookingRepository
        .createQueryBuilder('b')
        .select(['b.bookingId', 'b.guestName', 'b.checkInDate', 'b.updated_At'])
        .where('b.status = :status', { status: BookingStatus.CONFIRMED })
        .andWhere('b.checkInDate = :today', {
          today: new Date().toISOString().slice(0, 10),
        })
        .orderBy('b.updated_At', 'DESC')
        .limit(10)
        .getMany(),

      // Khởi tạo truy vấn lấy danh sách khách đã Check-out hoàn thành hôm nay
      this.bookingRepository
        .createQueryBuilder('b')
        .select([
          'b.bookingId',
          'b.guestName',
          'b.checkOutDate',
          'b.updated_At',
        ])
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkOutDate = :today', {
          today: new Date().toISOString().slice(0, 10),
        })
        .orderBy('b.updated_At', 'DESC')
        .limit(10)
        .getMany(),
    ]);

    const activities: {
      type: string;
      description: string;
      time: Date;
      bookingId?: number;
    }[] = [];

    for (const b of newBookings) {
      activities.push({
        type: 'new_booking',
        description: `Đặt phòng mới — ${b.guestName}`,
        time: b.created_At,
        bookingId: b.bookingId,
      });
    }

    for (const b of checkIns) {
      activities.push({
        type: 'check_in',
        description: `Check-in — ${b.guestName}`,
        time: b.updated_At,
        bookingId: b.bookingId,
      });
    }

    for (const b of checkOuts) {
      activities.push({
        type: 'check_out',
        description: `Check-out — ${b.guestName}`,
        time: b.updated_At,
        bookingId: b.bookingId,
      });
    }

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 20);
  }
}
