import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { Room } from '../../entities/room.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { RoomStatus } from '../../common/enums/room-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async getSummary() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const firstDayOfYear = `${now.getFullYear()}-01-01`;

    const [
      revenueToday,
      revenueMonth,
      revenueYear,
      roomStats,
      bookingStats,
      newBookingsToday,
      occupancyData,
    ] = await Promise.all([
      this.sumRevenue(todayStr, todayStr),
      this.sumRevenue(firstDayOfMonth, todayStr),
      this.sumRevenue(firstDayOfYear, todayStr),
      this.getRoomStats(),
      this.getBookingStats(),
      this.countNewBookingsToday(todayStr),
      this.getOccupancyRate(todayStr),
    ]);

    return {
      revenue: {
        today: revenueToday,
        thisMonth: revenueMonth,
        thisYear: revenueYear,
      },
      rooms: roomStats,
      bookings: {
        byStatus: bookingStats,
        newToday: newBookingsToday,
      },
      occupancyRate: occupancyData,
    };
  }

  // Tổng doanh thu booking COMPLETED trong khoảng ngày (theo checkInDate)
  private async sumRevenue(from: string, to: string): Promise<number> {
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
    return this.bookingRepository
      .createQueryBuilder('b')
      .where('DATE(b.created_At) = :today', { today: todayStr })
      .getCount();
  }

  private async getOccupancyRate(
    todayStr: string,
  ): Promise<{ occupied: number; total: number; rate: number }> {
    const [occupied, total] = await Promise.all([
      this.bookingRepository
        .createQueryBuilder('b')
        .innerJoin('b.bookingDetails', 'bd')
        .where('b.status = :status', { status: BookingStatus.CONFIRMED })
        .andWhere('b.checkInDate <= :today', { today: todayStr })
        .andWhere('b.checkOutDate > :today', { today: todayStr })
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
}
