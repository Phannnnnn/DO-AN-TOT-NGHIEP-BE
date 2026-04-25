import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { BedType } from '../../../common/enums/bed-type.enum';

export class CreateRoomBedDto {
  @IsInt()
  @IsNotEmpty()
  roomTypeId: number;

  @IsEnum(BedType)
  roomBedType: BedType;

  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;
}
