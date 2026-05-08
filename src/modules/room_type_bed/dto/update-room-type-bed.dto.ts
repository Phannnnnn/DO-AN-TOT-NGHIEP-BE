import { ValidateNested } from 'class-validator';
import { RoomTypeBedDataDto } from './room-type-bed-data.dto';
import { Type } from 'class-transformer';

export class UpdateRoomTypeBedDto {
  @ValidateNested({ each: true })
  @Type(() => RoomTypeBedDataDto)
  roomBeds: RoomTypeBedDataDto[];
}
