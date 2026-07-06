import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomStatus } from '../../../common/enums/room-status.enum';

export class CreateRoomDto {
  @IsInt()
  @IsPositive()
  roomTypeId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  roomNumber: string;

  @IsInt()
  @IsPositive()
  floor: number;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}
