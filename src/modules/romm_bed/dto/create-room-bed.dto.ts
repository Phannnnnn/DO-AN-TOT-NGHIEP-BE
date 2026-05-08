import { IsEnum } from 'class-validator';
import { BedType } from '../../../common/enums/bed-type.enum';

export class CreateRoomBedDto {
  @IsEnum(BedType)
  roomBedType: BedType;
}
