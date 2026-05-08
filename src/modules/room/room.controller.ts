import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  //Create new room - post/room
  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  // GET /room hoặc GET /room?roomTypeId=1
  @Get()
  async rooms() {
    return this.roomService.rooms();
  }

  @Get(':id')
  async roomById(@Param('id', ParseIntPipe) roomId: number) {
    return this.roomService.roomById(roomId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) roomId: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(roomId, updateRoomDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) roomId: number) {
    return this.roomService.remove(roomId);
  }
}
