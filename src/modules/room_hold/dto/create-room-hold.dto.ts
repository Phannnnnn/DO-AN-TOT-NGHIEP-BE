import {
  IsArray,
  IsInt,
  IsPositive,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';

export class CreateRoomHoldDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  roomIds: number[];

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;
}
