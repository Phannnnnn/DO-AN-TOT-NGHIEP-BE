import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoomHoldService } from './room_hold.service';

@Injectable()
export class RoomHoldScheduler {
  constructor(private readonly roomHoldService: RoomHoldService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpired(): Promise<void> {
    await this.roomHoldService.cleanupExpired();
  }
}
