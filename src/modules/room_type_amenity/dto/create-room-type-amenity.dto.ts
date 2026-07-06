import { IsArray, IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRoomTypeAmenityDto {
  @IsNumber()
  @IsNotEmpty()
  roomTypeId: number;

  @IsArray()
  @IsInt({ each: true })
  amenityIds: number[];
}
