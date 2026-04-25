import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomImageService } from './room_image.service';
import { CreateRoomImageDto } from './dto/create-room-image.dto';
import { UpdateRoomImageDto } from './dto/update-room-image.dto';

@Controller('room-image')
export class RoomImageController {
  constructor(private readonly roomImageService: RoomImageService) {}

  @Post()
  async create(@Body() createRoomImageDto: CreateRoomImageDto) {
    return this.roomImageService.create(createRoomImageDto);
  }

  @Get('room-type/:roomTypeId')
  async roomImages(@Param('roomTypeId', ParseIntPipe) roomTypeId: number) {
    return this.roomImageService.roomImages(roomTypeId);
  }

  @Get(':id')
  async roomImageById(@Param('id', ParseIntPipe) roomImageId: number) {
    return this.roomImageService.roomImageById(roomImageId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) roomImageId: number,
    @Body() updateRoomImageDto: UpdateRoomImageDto,
  ) {
    return this.roomImageService.update(roomImageId, updateRoomImageDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) roomImageId: number) {
    return this.roomImageService.remove(roomImageId);
  }
}
