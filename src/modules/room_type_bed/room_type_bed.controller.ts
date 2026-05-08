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
import { RoomTypeBedService } from './room_type_bed.service';
import { CreateRoomTypeBedDto } from './dto/create-room-type-bed.dto';
import { UpdateRoomTypeBedDto } from './dto/update-room-type-bed.dto';
import { IsOptional } from 'class-validator';

@Controller('room-type-bed')
export class RoomTypeBedController {
  constructor(private readonly roomTypeBedService: RoomTypeBedService) {}

  @Post()
  create(@Body() createRoomTypeBedDto: CreateRoomTypeBedDto) {
    return this.roomTypeBedService.create(createRoomTypeBedDto);
  }

  @Get()
  roomTypeBeds() {
    return this.roomTypeBedService.roomTypeBeds();
  }

  @Get(':roomTypeId')
  roomTypeBedByRoomTypeId(@Param('roomTypeId') roomTypeId: number) {
    return this.roomTypeBedService.roomTypeBedByRoomTypeId(roomTypeId);
  }

  @Patch(':roomTypeId')
  update(
    @Param('roomTypeId') roomTypeId: number,
    @Body() updateRoomTypeBed: UpdateRoomTypeBedDto,
  ) {
    return this.roomTypeBedService.update(roomTypeId, updateRoomTypeBed);
  }

  @Delete()
  remove(
    @Query('roomTypeId', new ParseIntPipe({ optional: true }))
    roomTypeId?: number,
    @Query('roomBedId', new ParseIntPipe({ optional: true }))
    roomBedId?: number,
  ) {
    return this.roomTypeBedService.remove(roomTypeId, roomBedId);
  }
}
