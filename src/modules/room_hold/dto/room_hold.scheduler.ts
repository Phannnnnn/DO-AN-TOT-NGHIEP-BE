import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoomHoldService } from '../room_hold.service';

@Injectable()
export class RoomHoldScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(RoomHoldScheduler.name);

  constructor(private readonly roomHoldService: RoomHoldService) {}

  async onApplicationBootstrap() {
    this.logger.log('Cleaning up expired room holds...');
    await this.roomHoldService.cleanupExpired();
    this.logger.log('Done cleaning up expired room holds.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredHolds(): Promise<void> {
    this.logger.log('Midnight cleanup: removing expired room holds...');
    await this.roomHoldService.cleanupExpired();
  }
}
