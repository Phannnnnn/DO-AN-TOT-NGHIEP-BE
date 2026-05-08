import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator';
import { RoomTypeBedDataDto } from './room-type-bed-data.dto';

export class CreateRoomTypeBedDto {
  @IsNotEmpty()
  @IsNumber()
  roomTypeId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTypeBedDataDto)
  roomBeds: RoomTypeBedDataDto[];
}
