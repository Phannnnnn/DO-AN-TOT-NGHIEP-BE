import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRoomBedDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  roomBedType?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
