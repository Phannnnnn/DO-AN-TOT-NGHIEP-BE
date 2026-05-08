import { IsNotEmpty, IsNumber } from 'class-validator';

export class RoomTypeBedDataDto {
  @IsNotEmpty()
  @IsNumber()
  roomBedId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
