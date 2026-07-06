import { Module } from '@nestjs/common';
import { HousekeepingController } from './housekeeping_task.controller';
import { HousekeepingService } from './housekeeping_task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingTask } from '../../entities/housekeeping-task.entity';
import { Room } from '../../entities/room.entity';

@Module({
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
  imports: [TypeOrmModule.forFeature([HousekeepingTask, Room])],
  exports: [HousekeepingService],
})
export class HousekeepingTaskModule {}
