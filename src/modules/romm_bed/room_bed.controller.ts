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
import { RoomBedService } from './room_bed.service';
import { CreateRoomBedDto } from './dto/create-room-bed.dto';
import { UpdateRoomBedDto } from './dto/update-room-bed.dto';

@Controller('room-bed')
export class BedController {
  constructor(private readonly roomBedService: RoomBedService) {}

  @Post()
  create(@Body() createRoomBedDto: CreateRoomBedDto) {
    return this.roomBedService.create(createRoomBedDto);
  }

  @Get(':roomTypeId')
  roomBeds(@Param('roomTypeId') roomTypeId: number) {
    return this.roomBedService.roomBeds(roomTypeId);
  }

  @Get(':id')
  roomBedById(@Param('id', ParseIntPipe) roomBedId: number) {
    return this.roomBedService.roomBedById(roomBedId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) roomBedId: number,
    @Body() updateRoomBedDto: UpdateRoomBedDto,
  ) {
    return this.roomBedService.update(roomBedId, updateRoomBedDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) roomBedId: number) {
    return this.roomBedService.remove(roomBedId);
  }
}
