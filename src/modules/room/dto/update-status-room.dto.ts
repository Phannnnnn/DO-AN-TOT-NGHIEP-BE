import { IsEnum, IsOptional } from 'class-validator';
import { RoomStatus } from '../../../common/enums/room-status.enum';

export class UpdateStatusRoomDto {
  @IsEnum(RoomStatus)
  status: RoomStatus;
}
