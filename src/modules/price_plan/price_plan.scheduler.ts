// price_plan.scheduler.ts
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
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = await this.isTodayHoliday(dateStr);

    await Promise.all([
      this.syncHolidayPlans(dateStr),
      this.syncWeekdayWeekendPlans(isWeekend, isHoliday),
    ]);
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
      // Kiểm tra có WEEKEND plan không
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
        // Fallback: dùng WEEKDAY
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
