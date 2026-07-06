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
import { CreateRoomImageDto } from '../../room_image/dto/create-room-image.dto';
import { RoomTypeBedDataDto } from '../../room_type_bed/dto/room-type-bed-data.dto';
import { RoomTypeCreatePricePlanDataDto } from './room-type-create-price-plan.dto';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  typeName: string;

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
  @Type(() => RoomTypeCreatePricePlanDataDto)
  @IsOptional()
  pricePlans?: RoomTypeCreatePricePlanDataDto[];
}
