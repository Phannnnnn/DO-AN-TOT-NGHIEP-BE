import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomTypeBedDataDto } from '../../room_type_bed/dto/room-type-bed-data.dto';
import { RoomTypeUpdatePricePlanDto } from './room-type-update-price-plan.dto';
import { UpdateRoomImageDto } from '../../room_image/dto/update-room-image.dto';

export class UpdateRoomTypeDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  typeName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  maxOccupancy?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  amenityIds?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTypeBedDataDto)
  @IsOptional()
  roomBeds?: RoomTypeBedDataDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRoomImageDto)
  @IsOptional()
  images?: UpdateRoomImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTypeUpdatePricePlanDto)
  @IsOptional()
  pricePlans?: RoomTypeUpdatePricePlanDto[];
}
