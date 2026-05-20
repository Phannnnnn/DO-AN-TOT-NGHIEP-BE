import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomTypeService } from './room_type.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-roomtype.dto';

@Controller('room-type')
export class RoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) {}

  @Post()
  async createRoomType(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypeService.create(createRoomTypeDto);
  }

  @Get()
  async roomTypes() {
    return this.roomTypeService.roomTypes();
  }

  @Get(':id')
  async roomTypeById(@Param('id') roomTypeId: number) {
    return this.roomTypeService.roomTypeById(roomTypeId);
  }

  @Patch(':id')
  async updateRoomType(
    @Param('id') roomTypeId: number,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
  ) {
    return this.roomTypeService.update(roomTypeId, updateRoomTypeDto);
  }

  @Delete(':id')
  async removeById(@Param('id') roomTypeId: number) {
    return this.roomTypeService.remove(roomTypeId);
  }
}
