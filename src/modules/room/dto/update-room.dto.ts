import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomStatus } from '../../../common/enums/room-status.enum';

export class UpdateRoomDto {
  @IsInt()
  @IsPositive()
  roomTypeId: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  roomNumber?: string;

  @IsInt()
  @IsPositive()
  floor?: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
