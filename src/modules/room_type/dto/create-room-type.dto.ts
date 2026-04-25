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
import { CreateRoomBedDto } from '../../romm_bed/dto/create-room-bed.dto';
import { CreateRoomImageDto } from '../../room_image/dto/create-room-image.dto';

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
  @Type(() => CreateRoomBedDto)
  @IsOptional()
  roomBeds?: CreateRoomBedDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomImageDto)
  @IsOptional()
  images?: CreateRoomImageDto[];
}
