import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping_task.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOUSEKEEPING, UserRole.ADMIN)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get()
  getTasks() {
    return this.housekeepingService.getTasks();
  }

  @Post(':id/claim')
  claimTask(@Param('id', ParseIntPipe) taskId: number, @Req() req: any) {
    return this.housekeepingService.claimTask(taskId, req.user.id);
  }

  @Patch(':id/complete')
  completeTask(@Param('id', ParseIntPipe) taskId: number, @Req() req: any) {
    return this.housekeepingService.completeTask(taskId, req.user.id);
  }
}
