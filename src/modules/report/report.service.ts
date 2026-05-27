import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { Room } from '../../entities/room.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { ReportGroupBy, ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
    @InjectRepository(BookingServiceEntity)
    private readonly bookingServiceRepository: Repository<BookingServiceEntity>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async getReport(query: ReportQueryDto) {
    if (query.from > query.to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc.');
    }

    const [revenueTimeline, revenueBreakdown, topRoomTypes, bookingByStatus] =
      await Promise.all([
        this.getRevenueTimeline(query),
        this.getRevenueBreakdown(query),
        this.getTopRoomTypes(query),
        this.getBookingByStatus(query),
      ]);

    return {
      period: { from: query.from, to: query.to, groupBy: query.groupBy },
      revenueTimeline,
      revenueBreakdown,
      topRoomTypes,
      bookingByStatus,
    };
  }

  // Doanh thu theo mốc thời gian (chỉ COMPLETED)
  private async getRevenueTimeline(
    query: ReportQueryDto,
  ): Promise<{ period: string; revenue: number }[]> {
    const format = this.dateFormat(query.groupBy);

    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .select(`DATE_FORMAT(b.checkInDate, '${format}')`, 'period')
      .addSelect('SUM(b.totalAmount)', 'revenue')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return rows.map((r) => ({ period: r.period, revenue: Number(r.revenue) }));
  }

  // Breakdown: tổng từ tiền phòng vs tổng từ dịch vụ
  private async getRevenueBreakdown(query: ReportQueryDto): Promise<{
    roomRevenue: number;
    serviceRevenue: number;
    total: number;
  }> {
    const [roomResult, serviceResult] = await Promise.all([
      this.bookingDetailRepository
        .createQueryBuilder('bd')
        .innerJoin('bd.booking', 'b')
        .select('COALESCE(SUM(bd.priceAtBooking), 0)', 'total')
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkInDate >= :from', { from: query.from })
        .andWhere('b.checkInDate <= :to', { to: query.to })
        .getRawOne(),

      this.bookingServiceRepository
        .createQueryBuilder('bs')
        .innerJoin('bs.bookingDetail', 'bd')
        .innerJoin('bd.booking', 'b')
        .select('COALESCE(SUM(bs.priceAtUsage * bs.quantity), 0)', 'total')
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkInDate >= :from', { from: query.from })
        .andWhere('b.checkInDate <= :to', { to: query.to })
        .getRawOne(),
    ]);

    const roomRevenue = Number(roomResult.total);
    const serviceRevenue = Number(serviceResult.total);

    return { roomRevenue, serviceRevenue, total: roomRevenue + serviceRevenue };
  }

  // Top 10 loại phòng doanh thu cao nhất
  private async getTopRoomTypes(query: ReportQueryDto): Promise<
    {
      roomTypeId: number;
      typeName: string;
      revenue: number;
      bookingCount: number;
    }[]
  > {
    const rows = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .innerJoin('bd.room', 'r')
      .innerJoin('r.roomType', 'rt')
      .select('rt.roomTypeId', 'roomTypeId')
      .addSelect('rt.typeName', 'typeName')
      .addSelect('SUM(bd.priceAtBooking)', 'revenue')
      .addSelect('COUNT(DISTINCT b.bookingId)', 'bookingCount')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('rt.roomTypeId')
      .addGroupBy('rt.typeName')
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany();

    return rows.map((r) => ({
      roomTypeId: Number(r.roomTypeId),
      typeName: r.typeName,
      revenue: Number(r.revenue),
      bookingCount: Number(r.bookingCount),
    }));
  }

  // Booking theo trạng thái trong kỳ (theo created_At)
  private async getBookingByStatus(
    query: ReportQueryDto,
  ): Promise<Record<BookingStatus, number>> {
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('DATE(b.created_At) >= :from', { from: query.from })
      .andWhere('DATE(b.created_At) <= :to', { to: query.to })
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

  private dateFormat(groupBy: ReportGroupBy): string {
    switch (groupBy) {
      case ReportGroupBy.DAY:
        return '%Y-%m-%d';
      case ReportGroupBy.MONTH:
        return '%Y-%m';
      case ReportGroupBy.YEAR:
        return '%Y';
    }
  }
}
