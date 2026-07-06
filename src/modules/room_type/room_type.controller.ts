import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomTypeService } from './room_type.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-roomtype.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('room-type')
export class RoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async createRoomType(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypeService.create(createRoomTypeDto);
  }

  @Roles(UserRole.RECEPTIONIST)
  @Get()
  async roomTypes() {
    return this.roomTypeService.roomTypes();
  }

  @Roles(UserRole.RECEPTIONIST)
  @Get(':id')
  async roomTypeById(@Param('id') roomTypeId: number) {
    return this.roomTypeService.roomTypeById(roomTypeId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateRoomType(
    @Param('id') roomTypeId: number,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
  ) {
    return this.roomTypeService.update(roomTypeId, updateRoomTypeDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async removeById(@Param('id') roomTypeId: number) {
    return this.roomTypeService.remove(roomTypeId);
  }
}
