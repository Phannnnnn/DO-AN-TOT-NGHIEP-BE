import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomBedService } from './room_bed.service';
import { CreateRoomBedDto } from './dto/create-room-bed.dto';
import { UpdateRoomBedDto } from './dto/update-room-bed.dto';
import { UserRole } from '../../entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('room-bed')
export class BedController {
  constructor(private readonly roomBedService: RoomBedService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createRoomBedDto: CreateRoomBedDto) {
    return this.roomBedService.create(createRoomBedDto);
  }

  @Get()
  roomBeds() {
    return this.roomBedService.roomBeds();
  }

  @Get(':id')
  roomBedById(@Param('id', ParseIntPipe) roomBedId: number) {
    return this.roomBedService.roomBedById(roomBedId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) roomBedId: number,
    @Body() updateRoomBedDto: UpdateRoomBedDto,
  ) {
    return this.roomBedService.update(roomBedId, updateRoomBedDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) roomBedId: number) {
    return this.roomBedService.remove(roomBedId);
  }
}
