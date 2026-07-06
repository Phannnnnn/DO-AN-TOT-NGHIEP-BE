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
import { RoomTypeAmenityService } from './room_type_amenity.service';
import { CreateRoomTypeAmenityDto } from './dto/create-room-type-amenity.dto';
import { UpdateRoomTypeAmenityDto } from './dto/update-room-type-amenity.dto';

@Controller('room-type-amenity')
export class RoomTypeAmenityController {
  constructor(
    private readonly roomTypeAmenityService: RoomTypeAmenityService,
  ) {}

  @Post()
  create(@Body() createRoomTypeAmenityDto: CreateRoomTypeAmenityDto) {
    return this.roomTypeAmenityService.create(createRoomTypeAmenityDto);
  }

  @Get()
  roomTypeAmenities() {
    return this.roomTypeAmenityService.roomTypeAmenities();
  }

  @Get(':id')
  roomTypeAmenityById(@Param('id') roomTypeId: number) {
    return this.roomTypeAmenityService.roomTypeAmenityById(roomTypeId);
  }

  @Patch(':id')
  update(
    @Param('id') roomTypeId: number,
    @Body() updateRoomTypeAmenityDto: UpdateRoomTypeAmenityDto,
  ) {
    return this.roomTypeAmenityService.update(
      roomTypeId,
      updateRoomTypeAmenityDto,
    );
  }

  @Delete()
  remove(
    @Query('roomTypeId', new ParseIntPipe({ optional: true }))
    roomTypeId?: number,
    @Query('roomAmenityId', new ParseIntPipe({ optional: true }))
    roomAmenityId?: number,
  ) {
    return this.roomTypeAmenityService.remove(roomTypeId, roomAmenityId);
  }
}
