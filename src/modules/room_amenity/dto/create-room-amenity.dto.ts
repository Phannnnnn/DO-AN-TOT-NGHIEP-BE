import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AmenityCategory } from '../../../common/enums/room-amenity-category.enum';

export class CreateRoomAmenityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(AmenityCategory)
  category: AmenityCategory;
}
