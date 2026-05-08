import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomTypeDto } from './create-room-type.dto';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomTypeBedDataDto } from '../../room_type_bed/dto/room-type-bed-data.dto';
import { CreateRoomImageDto } from '../../room_image/dto/create-room-image.dto';
import { RoomTypeUpdatePricePlanDto } from './room-type-update-price-plan.dto';

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
  @Type(() => CreateRoomImageDto)
  @IsOptional()
  images?: CreateRoomImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTypeUpdatePricePlanDto)
  @IsOptional()
  pricePlans?: RoomTypeUpdatePricePlanDto[];
}
