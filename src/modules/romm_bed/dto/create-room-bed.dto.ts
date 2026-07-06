import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoomBedDto {
  @IsString()
  @IsNotEmpty()
  roomBedType: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}
