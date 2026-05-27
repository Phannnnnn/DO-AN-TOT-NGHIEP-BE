import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { RoomHoldService } from './room_hold.service';
import { CreateRoomHoldDto } from './dto/create-room-hold.dto';

@Controller('room-hold')
export class RoomHoldController {
  constructor(private readonly roomHoldService: RoomHoldService) {}

  @Post()
  hold(@Body() dto: CreateRoomHoldDto) {
    return this.roomHoldService.hold(dto);
  }

  @Delete(':sessionId')
  release(@Param('sessionId') sessionId: string) {
    return this.roomHoldService.release(sessionId);
  }
}
