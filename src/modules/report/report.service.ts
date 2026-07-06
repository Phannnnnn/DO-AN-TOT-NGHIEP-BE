import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingServiceEntity } from '../../entities/booking-service.entity';
import { Room } from '../../entities/room.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { ReportGroupBy, ReportQueryDto } from './dto/report-query.dto';
import {
  HousekeepingTask,
  HousekeepingTaskStatus,
} from '../../entities/housekeeping-task.entity';
import { Customer } from '../../entities/customer.entity';
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
    @InjectRepository(HousekeepingTask)
    private readonly housekeepingTaskRepository: Repository<HousekeepingTask>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}
  async getReport(query: ReportQueryDto) {
    if (query.from > query.to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc.');
    }
    const [
      revenueTimeline,
      revenueBreakdown,
      topRoomTypes,
      bookingByStatus,
      cancellations,
      occupancyTrend,
      customerNationality,
      housekeepingPerformance,
      topCustomers,
      occupancyByDay,
      yoyComparison,
      forecast30Days,
    ] = await Promise.all([
      this.getRevenueTimeline(query),
      this.getRevenueBreakdown(query),
      this.getTopRoomTypes(query),
      this.getBookingByStatus(query),
      this.getCancellations(query),
      this.getOccupancyTrend(query),
      this.getCustomerNationality(query),
      this.getHousekeepingPerformance(query),
      this.getTopCustomers(query),
      this.getOccupancyByDay(query),
      this.getYoYComparison(query),
      this.getForecast30Days(query),
    ]);
    const roomsSold = revenueBreakdown.roomsSold;
    const roomRevenue = revenueBreakdown.roomRevenue;
    const adr = roomsSold > 0 ? roomRevenue / roomsSold : 0;
    const avgOccupancyRate =
      occupancyByDay.length > 0
        ? occupancyByDay.reduce((sum, d) => sum + d.occupancyRate, 0) /
          occupancyByDay.length
        : 0;
    const revpar = adr * (avgOccupancyRate / 100);
    return {
      period: { from: query.from, to: query.to, groupBy: query.groupBy },
      revenueTimeline,
      revenueBreakdown: {
        ...revenueBreakdown,
        adr,
        revpar,
        avgOccupancyRate: Math.round(avgOccupancyRate),
      },
      topRoomTypes,
      bookingByStatus,
      cancellations,
      occupancyTrend,
      customerNationality,
      housekeepingPerformance,
      topCustomers,
      occupancyByDay,
      yoyComparison,
      forecast30Days,
    };
  }
  private async getRevenueTimeline(query: ReportQueryDto): Promise<
    {
      period: string;
      roomRevenue: number;
      serviceRevenue: number;
      revenue: number;
    }[]
  > {
    let selectPeriodExpr = '';
    if (query.groupBy === ReportGroupBy.QUARTER) {
      selectPeriodExpr = `CONCAT(YEAR(b.checkInDate), '-Q', QUARTER(b.checkInDate))`;
    } else {
      const format = this.dateFormat(query.groupBy);
      selectPeriodExpr = `DATE_FORMAT(b.checkInDate, '${format}')`;
    }
    const roomRows = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .select(selectPeriodExpr, 'period')
      .addSelect('SUM(bd.priceAtBooking)', 'roomRevenue')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('period')
      .getRawMany();
    const serviceRows = await this.bookingServiceRepository
      .createQueryBuilder('bs')
      .innerJoin('bs.bookingDetail', 'bd')
      .innerJoin('bd.booking', 'b')
      .select(selectPeriodExpr, 'period')
      .addSelect('SUM(bs.priceAtUsage * bs.quantity)', 'serviceRevenue')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('period')
      .getRawMany();
    const totalRows = await this.bookingRepository
      .createQueryBuilder('b')
      .select(selectPeriodExpr, 'period')
      .addSelect('SUM(b.totalAmount)', 'total')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('period')
      .getRawMany();
    const roomMap = new Map(
      roomRows.map((r) => [r.period, Number(r.roomRevenue)]),
    );
    const serviceMap = new Map(
      serviceRows.map((r) => [r.period, Number(r.serviceRevenue)]),
    );
    const totalMap = new Map(totalRows.map((r) => [r.period, Number(r.total)]));
    const allPeriods = Array.from(
      new Set([...roomMap.keys(), ...serviceMap.keys(), ...totalMap.keys()]),
    );
    const timeline = allPeriods.map((period) => {
      const roomRevenue = roomMap.get(period) || 0;
      const serviceRevenue = serviceMap.get(period) || 0;
      const revenue = totalMap.get(period) || roomRevenue + serviceRevenue;
      return { period, roomRevenue, serviceRevenue, revenue };
    });
    timeline.sort((a, b) => a.period.localeCompare(b.period));
    return this.fillMissingPeriods(
      timeline,
      query.from,
      query.to,
      query.groupBy,
    );
  }
  private async getRevenueBreakdown(query: ReportQueryDto): Promise<{
    roomRevenue: number;
    serviceRevenue: number;
    total: number;
    roomsSold: number;
  }> {
    const [roomResult, serviceResult, roomsSoldResult] = await Promise.all([
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
      this.bookingDetailRepository
        .createQueryBuilder('bd')
        .innerJoin('bd.booking', 'b')
        .select('COUNT(*)', 'roomsSold')
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkInDate >= :from', { from: query.from })
        .andWhere('b.checkInDate <= :to', { to: query.to })
        .getRawOne(),
    ]);
    const roomRevenue = Number(roomResult.total);
    const serviceRevenue = Number(serviceResult.total);
    const roomsSold = Number(roomsSoldResult.roomsSold);
    return {
      roomRevenue,
      serviceRevenue,
      total: roomRevenue + serviceRevenue,
      roomsSold,
    };
  }
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
  private async getCancellations(query: ReportQueryDto): Promise<number> {
    return this.bookingRepository
      .createQueryBuilder('b')
      .where('b.status = :status', { status: BookingStatus.CANCELLED })
      .andWhere('DATE(b.created_At) >= :from', { from: query.from })
      .andWhere('DATE(b.created_At) <= :to', { to: query.to })
      .getCount();
  }
  private async getOccupancyTrend(query: ReportQueryDto): Promise<{
    weekday: number;
    weekend: number;
  }> {
    const rows = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .select('DAYOFWEEK(b.checkInDate)', 'dayOfWeek')
      .addSelect('COUNT(*)', 'count')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('dayOfWeek')
      .getRawMany();
    let weekday = 0;
    let weekend = 0;
    for (const row of rows) {
      const dayOfWeek = Number(row.dayOfWeek);
      if (dayOfWeek === 1 || dayOfWeek === 7) {
        weekend += Number(row.count);
      } else {
        weekday += Number(row.count);
      }
    }
    return { weekday, weekend };
  }
  private async getCustomerNationality(query: ReportQueryDto): Promise<
    {
      nationality: string;
      count: number;
    }[]
  > {
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.customer', 'c')
      .select('c.nationality', 'nationality')
      .addSelect('COUNT(DISTINCT c.customerId)', 'count')
      .where('DATE(b.created_At) >= :from', { from: query.from })
      .andWhere('DATE(b.created_At) <= :to', { to: query.to })
      .groupBy('c.nationality')
      .orderBy('count', 'DESC')
      .getRawMany();
    return rows.map((r) => ({
      nationality: r.nationality || 'Không xác định',
      count: Number(r.count),
    }));
  }
  private async getHousekeepingPerformance(query: ReportQueryDto): Promise<{
    avgCompletionTimeMinutes: number;
    totalCompleted: number;
  }> {
    const result = await this.housekeepingTaskRepository
      .createQueryBuilder('hk')
      .select(
        'AVG(TIMESTAMPDIFF(MINUTE, hk.startedAt, hk.completedAt))',
        'avgTime',
      )
      .addSelect('COUNT(*)', 'total')
      .where('hk.status = :status', { status: HousekeepingTaskStatus.DONE })
      .andWhere('DATE(hk.completedAt) >= :from', { from: query.from })
      .andWhere('DATE(hk.completedAt) <= :to', { to: query.to })
      .getRawOne();
    return {
      avgCompletionTimeMinutes: result.avgTime
        ? Number(Number(result.avgTime).toFixed(1))
        : 0,
      totalCompleted: Number(result.total || 0),
    };
  }
  private async getTopCustomers(query: ReportQueryDto): Promise<any[]> {
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.customer', 'c')
      .select('c.customerId', 'customerId')
      .addSelect('c.fullName', 'fullName')
      .addSelect('c.email', 'email')
      .addSelect('c.phone', 'phone')
      .addSelect('SUM(b.totalAmount)', 'totalSpent')
      .addSelect('COUNT(b.bookingId)', 'bookingCount')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('DATE(b.created_At) >= :from', { from: query.from })
      .andWhere('DATE(b.created_At) <= :to', { to: query.to })
      .groupBy('c.customerId')
      .addGroupBy('c.fullName')
      .addGroupBy('c.email')
      .addGroupBy('c.phone')
      .orderBy('totalSpent', 'DESC')
      .limit(10)
      .getRawMany();
    return rows.map((r) => ({
      customerId: Number(r.customerId),
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      totalSpent: Number(r.totalSpent),
      bookingCount: Number(r.bookingCount),
    }));
  }
  private async getOccupancyByDay(query: ReportQueryDto): Promise<
    {
      date: string;
      roomsAvailable: number;
      roomsSold: number;
      occupancyRate: number;
      adr: number;
      revpar: number;
    }[]
  > {
    const totalRooms = await this.roomRepository.count();
    if (totalRooms === 0) return [];
    const rows = await this.bookingDetailRepository
      .createQueryBuilder('bd')
      .innerJoin('bd.booking', 'b')
      .select("DATE_FORMAT(b.checkInDate, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'roomsSold')
      .addSelect('SUM(bd.priceAtBooking)', 'revenue')
      .where('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.checkInDate >= :from', { from: query.from })
      .andWhere('b.checkInDate <= :to', { to: query.to })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
    const dataMap = new Map(rows.map((r) => [r.date, r]));
    const [yFrom, mFrom, dFrom] = query.from.split('-').map(Number);
    const [yTo, mTo, dTo] = query.to.split('-').map(Number);
    const from = new Date(yFrom, mFrom - 1, dFrom);
    const to = new Date(yTo, mTo - 1, dTo);
    const result: {
      date: string;
      roomsAvailable: number;
      roomsSold: number;
      occupancyRate: number;
      adr: number;
      revpar: number;
    }[] = [];
    const current = new Date(from);
    while (current <= to) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const row = dataMap.get(dateStr);
      if (row) {
        const roomsSold = Number(row.roomsSold);
        const revenue = Number(row.revenue);
        const occupancyRate = Math.round((roomsSold / totalRooms) * 100);
        const adr = roomsSold > 0 ? revenue / roomsSold : 0;
        const revpar = adr * (occupancyRate / 100);
        result.push({
          date: dateStr,
          roomsAvailable: totalRooms,
          roomsSold,
          occupancyRate,
          adr: Math.round(adr),
          revpar: Math.round(revpar),
        });
      } else {
        result.push({
          date: dateStr,
          roomsAvailable: totalRooms,
          roomsSold: 0,
          occupancyRate: 0,
          adr: 0,
          revpar: 0,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  }
  private async getYoYComparison(query: ReportQueryDto): Promise<{
    thisYear: {
      period: string;
      revenue: number;
    }[];
    lastYear: {
      period: string;
      revenue: number;
    }[];
  }> {
    let selectPeriodExpr = '';
    if (query.groupBy === ReportGroupBy.QUARTER) {
      selectPeriodExpr = `CONCAT(YEAR(b.checkInDate), '-Q', QUARTER(b.checkInDate))`;
    } else {
      const format = this.dateFormat(query.groupBy);
      selectPeriodExpr = `DATE_FORMAT(b.checkInDate, '${format}')`;
    }
    const lastYearFrom = this.shiftYearBack(query.from);
    const lastYearTo = this.shiftYearBack(query.to);
    const [thisYearRows, lastYearRows] = await Promise.all([
      this.bookingRepository
        .createQueryBuilder('b')
        .select(selectPeriodExpr, 'period')
        .addSelect('SUM(b.totalAmount)', 'revenue')
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkInDate >= :from', { from: query.from })
        .andWhere('b.checkInDate <= :to', { to: query.to })
        .groupBy('period')
        .orderBy('period', 'ASC')
        .getRawMany(),
      this.bookingRepository
        .createQueryBuilder('b')
        .select(selectPeriodExpr, 'period')
        .addSelect('SUM(b.totalAmount)', 'revenue')
        .where('b.status = :status', { status: BookingStatus.COMPLETED })
        .andWhere('b.checkInDate >= :from', { from: lastYearFrom })
        .andWhere('b.checkInDate <= :to', { to: lastYearTo })
        .groupBy('period')
        .orderBy('period', 'ASC')
        .getRawMany(),
    ]);
    const thisYearTimeline = thisYearRows.map((r) => ({
      period: r.period,
      revenue: Number(r.revenue),
    }));
    const lastYearTimeline = lastYearRows.map((r) => ({
      period: r.period,
      revenue: Number(r.revenue),
    }));
    return {
      thisYear: this.fillMissingPeriodsSimple(
        thisYearTimeline,
        query.from,
        query.to,
        query.groupBy,
      ),
      lastYear: this.fillMissingPeriodsSimple(
        lastYearTimeline,
        lastYearFrom,
        lastYearTo,
        query.groupBy,
      ),
    };
  }
  private async getForecast30Days(query: ReportQueryDto): Promise<
    {
      date: string;
      confirmedRooms: number;
      pendingRooms: number;
      occupancyRate: number;
    }[]
  > {
    const totalRooms = await this.roomRepository.count();
    if (totalRooms === 0) return [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const endDate = this.dateAdd(todayStr, 30);
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .innerJoin('b.bookingDetails', 'bd')
      .select("DATE_FORMAT(b.checkInDate, '%Y-%m-%d')", 'date')
      .addSelect('b.status', 'status')
      .addSelect('COUNT(DISTINCT bd.roomId)', 'rooms')
      .where('b.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      })
      .andWhere('b.checkInDate > :today', { today: todayStr })
      .andWhere('b.checkInDate <= :end', { end: endDate })
      .groupBy('date')
      .addGroupBy('b.status')
      .orderBy('date', 'ASC')
      .getRawMany();
    const map = new Map<
      string,
      {
        confirmed: number;
        pending: number;
      }
    >();
    for (const row of rows) {
      const key = String(row.date).slice(0, 10);
      if (!map.has(key)) map.set(key, { confirmed: 0, pending: 0 });
      const entry = map.get(key)!;
      if (row.status === BookingStatus.CONFIRMED)
        entry.confirmed += Number(row.rooms);
      if (row.status === BookingStatus.PENDING)
        entry.pending += Number(row.rooms);
    }
    return Array.from({ length: 30 }, (_, i) => {
      const date = this.dateAdd(todayStr, i + 1);
      const entry = map.get(date) ?? { confirmed: 0, pending: 0 };
      const total = entry.confirmed + entry.pending;
      return {
        date,
        confirmedRooms: entry.confirmed,
        pendingRooms: entry.pending,
        occupancyRate: Math.min(Math.round((total / totalRooms) * 100), 100),
      };
    });
  }
  private dateFormat(groupBy: ReportGroupBy): string {
    switch (groupBy) {
      case ReportGroupBy.DAY:
        return '%Y-%m-%d';
      case ReportGroupBy.MONTH:
        return '%Y-%m';
      case ReportGroupBy.YEAR:
        return '%Y';
      case ReportGroupBy.QUARTER:
        return '%Y-Q';
    }
  }
  private shiftYearBack(dateStr: string): string {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  }
  private dateAdd(base: string, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  private fillMissingPeriods(
    timeline: {
      period: string;
      roomRevenue: number;
      serviceRevenue: number;
      revenue: number;
    }[],
    fromStr: string,
    toStr: string,
    groupBy: ReportGroupBy,
  ): {
    period: string;
    roomRevenue: number;
    serviceRevenue: number;
    revenue: number;
  }[] {
    const [yFrom, mFrom, dFrom] = fromStr.split('-').map(Number);
    const [yTo, mTo, dTo] = toStr.split('-').map(Number);
    const from = new Date(yFrom, mFrom - 1, dFrom);
    const to = new Date(yTo, mTo - 1, dTo);
    const result: {
      period: string;
      roomRevenue: number;
      serviceRevenue: number;
      revenue: number;
    }[] = [];
    const timelineMap = new Map(timeline.map((item) => [item.period, item]));
    if (groupBy === ReportGroupBy.DAY) {
      const current = new Date(from);
      while (current <= to) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const periodStr = `${yyyy}-${mm}-${dd}`;
        const existing = timelineMap.get(periodStr);
        result.push({
          period: periodStr,
          roomRevenue: existing?.roomRevenue || 0,
          serviceRevenue: existing?.serviceRevenue || 0,
          revenue: existing?.revenue || 0,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (groupBy === ReportGroupBy.MONTH) {
      const current = new Date(from.getFullYear(), from.getMonth(), 1);
      const targetEnd = new Date(to.getFullYear(), to.getMonth(), 1);
      while (current <= targetEnd) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const periodStr = `${yyyy}-${mm}`;
        const existing = timelineMap.get(periodStr);
        result.push({
          period: periodStr,
          roomRevenue: existing?.roomRevenue || 0,
          serviceRevenue: existing?.serviceRevenue || 0,
          revenue: existing?.revenue || 0,
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else if (groupBy === ReportGroupBy.YEAR) {
      const startYear = from.getFullYear();
      const endYear = to.getFullYear();
      for (let y = startYear; y <= endYear; y++) {
        const periodStr = String(y);
        const existing = timelineMap.get(periodStr);
        result.push({
          period: periodStr,
          roomRevenue: existing?.roomRevenue || 0,
          serviceRevenue: existing?.serviceRevenue || 0,
          revenue: existing?.revenue || 0,
        });
      }
    } else if (groupBy === ReportGroupBy.QUARTER) {
      const current = new Date(
        from.getFullYear(),
        Math.floor(from.getMonth() / 3) * 3,
        1,
      );
      const targetEnd = new Date(
        to.getFullYear(),
        Math.floor(to.getMonth() / 3) * 3,
        1,
      );
      while (current <= targetEnd) {
        const yyyy = current.getFullYear();
        const q = Math.floor(current.getMonth() / 3) + 1;
        const periodStr = `${yyyy}-Q${q}`;
        const existing = timelineMap.get(periodStr);
        result.push({
          period: periodStr,
          roomRevenue: existing?.roomRevenue || 0,
          serviceRevenue: existing?.serviceRevenue || 0,
          revenue: existing?.revenue || 0,
        });
        current.setMonth(current.getMonth() + 3);
      }
    }
    return result;
  }
  private fillMissingPeriodsSimple(
    timeline: {
      period: string;
      revenue: number;
    }[],
    fromStr: string,
    toStr: string,
    groupBy: ReportGroupBy,
  ): {
    period: string;
    revenue: number;
  }[] {
    const [yFrom, mFrom, dFrom] = fromStr.split('-').map(Number);
    const [yTo, mTo, dTo] = toStr.split('-').map(Number);
    const from = new Date(yFrom, mFrom - 1, dFrom);
    const to = new Date(yTo, mTo - 1, dTo);
    const result: {
      period: string;
      revenue: number;
    }[] = [];
    const timelineMap = new Map(
      timeline.map((item) => [item.period, item.revenue]),
    );
    if (groupBy === ReportGroupBy.DAY) {
      const current = new Date(from);
      while (current <= to) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const periodStr = `${yyyy}-${mm}-${dd}`;
        result.push({
          period: periodStr,
          revenue: timelineMap.get(periodStr) || 0,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (groupBy === ReportGroupBy.MONTH) {
      const current = new Date(from.getFullYear(), from.getMonth(), 1);
      const targetEnd = new Date(to.getFullYear(), to.getMonth(), 1);
      while (current <= targetEnd) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const periodStr = `${yyyy}-${mm}`;
        result.push({
          period: periodStr,
          revenue: timelineMap.get(periodStr) || 0,
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else if (groupBy === ReportGroupBy.YEAR) {
      const startYear = from.getFullYear();
      const endYear = to.getFullYear();
      for (let y = startYear; y <= endYear; y++) {
        const periodStr = String(y);
        result.push({
          period: periodStr,
          revenue: timelineMap.get(periodStr) || 0,
        });
      }
    } else if (groupBy === ReportGroupBy.QUARTER) {
      const current = new Date(
        from.getFullYear(),
        Math.floor(from.getMonth() / 3) * 3,
        1,
      );
      const targetEnd = new Date(
        to.getFullYear(),
        Math.floor(to.getMonth() / 3) * 3,
        1,
      );
      while (current <= targetEnd) {
        const yyyy = current.getFullYear();
        const q = Math.floor(current.getMonth() / 3) + 1;
        const periodStr = `${yyyy}-Q${q}`;
        result.push({
          period: periodStr,
          revenue: timelineMap.get(periodStr) || 0,
        });
        current.setMonth(current.getMonth() + 3);
      }
    }
    return result;
  }
}
