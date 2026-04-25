import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { BedType } from '../../../common/enums/bed-type.enum';

export class UpdateRoomBedDto {
  @IsEnum(BedType)
  @IsOptional()
  bedType?: BedType;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
