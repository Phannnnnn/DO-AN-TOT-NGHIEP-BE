import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricePlan } from '../../entities/price-plan.entity';
import { PricePlanType } from '../../common/enums/price-plan-type.enum';
@Injectable()
export class PricePlanScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(PricePlanScheduler.name);
  constructor(
    @InjectRepository(PricePlan)
    private readonly pricePlanRepository: Repository<PricePlan>,
  ) {}
  async onApplicationBootstrap() {
    this.logger.log('Syncing active price plans...');
    await this.syncActivePlans();
    this.logger.log('Done syncing active price plans.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncActivePlans() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const isWeekend = [0, 6].includes(today.getDay());

    // Lấy tất cả plans, group theo roomTypeId
    const allPlans = await this.pricePlanRepository.find();
    const byRoomType = new Map<number, PricePlan[]>();
    for (const plan of allPlans) {
      const list = byRoomType.get(plan.roomTypeId) ?? [];
      list.push(plan);
      byRoomType.set(plan.roomTypeId, list);
    }

    const updates: PricePlan[] = [];

    for (const [, plans] of byRoomType) {
      const hasHolidayToday = plans.some(
        (p) =>
          p.type === PricePlanType.HOLIDAY &&
          p.dateFrom &&
          p.dateTo &&
          p.dateFrom <= dateStr &&
          p.dateTo >= dateStr,
      );

      for (const plan of plans) {
        let shouldBeActive: boolean;

        if (plan.type === PricePlanType.HOLIDAY) {
          shouldBeActive =
            !!plan.dateFrom &&
            !!plan.dateTo &&
            plan.dateFrom <= dateStr &&
            plan.dateTo >= dateStr;
        } else if (hasHolidayToday) {
          shouldBeActive = false;
        } else if (plan.type === PricePlanType.WEEKEND) {
          shouldBeActive = isWeekend;
        } else {
          // WEEKDAY
          const hasWeekend = plans.some(
            (p) => p.type === PricePlanType.WEEKEND,
          );
          shouldBeActive = !isWeekend || !hasWeekend;
        }

        if (plan.isActive !== shouldBeActive) {
          plan.isActive = shouldBeActive;
          updates.push(plan);
        }
      }
    }

    if (updates.length > 0) {
      await this.pricePlanRepository.save(updates);
    }
  }
  private async isTodayHoliday(dateStr: string): Promise<boolean> {
    const holiday = await this.pricePlanRepository
      .createQueryBuilder('pp')
      .where('pp.type = :type', { type: PricePlanType.HOLIDAY })
      .andWhere('pp.dateFrom <= :date', { date: dateStr })
      .andWhere('pp.dateTo >= :date', { date: dateStr })
      .getOne();
    return !!holiday;
  }
  private async syncHolidayPlans(dateStr: string): Promise<void> {
    const allHolidays = await this.pricePlanRepository.find({
      where: { type: PricePlanType.HOLIDAY },
    });
    await Promise.all(
      allHolidays.map((plan) => {
        const inRange =
          !!plan.dateFrom &&
          !!plan.dateTo &&
          plan.dateFrom <= dateStr &&
          plan.dateTo >= dateStr;
        if (plan.isActive !== inRange) {
          plan.isActive = inRange;
          return this.pricePlanRepository.save(plan);
        }
      }),
    );
  }
  private async syncWeekdayWeekendPlans(
    isWeekend: boolean,
    isHoliday: boolean,
  ): Promise<void> {
    if (isHoliday) {
      await this.pricePlanRepository.update(
        { type: PricePlanType.WEEKDAY },
        { isActive: false },
      );
      await this.pricePlanRepository.update(
        { type: PricePlanType.WEEKEND },
        { isActive: false },
      );
      return;
    }
    if (isWeekend) {
      const hasWeekend = await this.pricePlanRepository.exists({
        where: { type: PricePlanType.WEEKEND },
      });
      if (hasWeekend) {
        await this.pricePlanRepository.update(
          { type: PricePlanType.WEEKDAY },
          { isActive: false },
        );
        await this.pricePlanRepository.update(
          { type: PricePlanType.WEEKEND },
          { isActive: true },
        );
      } else {
        await this.pricePlanRepository.update(
          { type: PricePlanType.WEEKDAY },
          { isActive: true },
        );
      }
    } else {
      await this.pricePlanRepository.update(
        { type: PricePlanType.WEEKDAY },
        { isActive: true },
      );
      await this.pricePlanRepository.update(
        { type: PricePlanType.WEEKEND },
        { isActive: false },
      );
    }
  }
}
