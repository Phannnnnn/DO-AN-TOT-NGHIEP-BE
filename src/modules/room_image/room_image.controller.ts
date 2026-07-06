import { Controller } from '@nestjs/common';
import { RoomImageService } from './room_image.service';

@Controller('room-image')
export class RoomImageController {
  constructor(private readonly roomImageService: RoomImageService) {}
}
