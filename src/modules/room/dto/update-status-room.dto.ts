import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomStatus } from '../../../common/enums/room-status.enum';

export class UpdateStatusRoomDto {
  @IsInt()
  @IsPositive()
  roomId: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
