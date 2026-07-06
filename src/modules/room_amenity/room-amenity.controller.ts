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
import { CreateRoomAmenityDto } from './dto/create-room-amenity.dto';
import { RoomAmenityService } from './room-amenity.service';
import { UpdateRoomAmenityDto } from './dto/update-room-amenity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('amenity')
export class RoomAmenityController {
  constructor(private readonly roomAmenityService: RoomAmenityService) {}

  @Roles(UserRole.ADMIN)
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

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') amenityId: number,
    @Body() updateRoomAmenityDto: UpdateRoomAmenityDto,
  ) {
    return this.roomAmenityService.update(amenityId, updateRoomAmenityDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') amenityId: number) {
    return this.roomAmenityService.remove(amenityId);
  }
}
