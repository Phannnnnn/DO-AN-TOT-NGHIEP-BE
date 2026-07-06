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
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateStatusRoomDto } from './dto/update-status-room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body()
    createRoomDto: CreateRoomDto,
  ) {
    return this.roomService.create(createRoomDto);
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.USER)
  @Get()
  async rooms() {
    return this.roomService.rooms();
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.USER)
  @Get(':id')
  async roomById(
    @Param('id', ParseIntPipe)
    roomId: number,
  ) {
    return this.roomService.roomById(roomId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe)
    roomId: number,
    @Body()
    updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(roomId, updateRoomDto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateStatus(
    @Param('id')
    roomId: number,
    updateStatusRoom: UpdateStatusRoomDto,
  ) {
    return this.roomService.updateStatus(roomId, updateStatusRoom);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe)
    roomId: number,
  ) {
    return this.roomService.remove(roomId);
  }
}
