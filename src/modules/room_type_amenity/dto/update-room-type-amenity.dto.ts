import { IsArray, IsInt } from 'class-validator';

export class UpdateRoomTypeAmenityDto {
  @IsArray()
  @IsInt({ each: true })
  amenityIds: number[];
}
