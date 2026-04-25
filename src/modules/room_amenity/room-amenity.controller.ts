import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRoomAmenityDto } from './dto/create-room-amenity.dto';
import { RoomAmenityService } from './room-amenity.service';
import { UpdateRoomAmenityDto } from './dto/update-room-amenity.dto';
import { UpdateRoomTypeAmenityDto } from '../room_type_amenity/dto/update-room-type-amenity.dto';

@Controller('amenity')
export class RoomAmenityController {
  constructor(private readonly roomAmenityService: RoomAmenityService) {}

  @Post()
  create(@Body() createAmenityDto: CreateRoomAmenityDto) {
    return this.roomAmenityService.create(createAmenityDto);
  }

  @Get()
  amenities() {
    return this.roomAmenityService.amenities();
  }

  @Get(':id')
  amenityById(@Param('id') amenityId: number) {
    return this.roomAmenityService.amenityById(amenityId);
  }

  @Patch(':id')
  update(
    @Param('id') amenityId: number,
    @Body() updateRoomAmenityDto: UpdateRoomAmenityDto,
  ) {
    return this.roomAmenityService.update(amenityId, updateRoomAmenityDto);
  }

  @Delete(':id')
  remove(@Param('id') amenityId: number) {
    return this.roomAmenityService.remove(amenityId);
  }
}
