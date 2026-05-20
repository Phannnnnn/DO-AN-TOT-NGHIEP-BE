import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AmenityCategory } from '../../../common/enums/room-amenity-category.enum';

export class CreateRoomAmenityDto {
  @IsString()
  @IsNotEmpty()
  roomAmenityName: string;

  @IsEnum(AmenityCategory)
  category: AmenityCategory;
}
