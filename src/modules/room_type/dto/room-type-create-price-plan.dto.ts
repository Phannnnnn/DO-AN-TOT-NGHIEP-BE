import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PricePlanType } from '../../../common/enums/price-plan-type.enum';

export class RoomTypeCreatePricePlanDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pricePlanName: string;

  @IsEnum(PricePlanType)
  type: PricePlanType;

  @IsNotEmpty()
  basePrice: number;

  @ValidateIf((o) => o.type === PricePlanType.HOLIDAY)
  @IsNotEmpty()
  @IsDateString()
  dateFrom?: string;

  @ValidateIf((o) => o.type === PricePlanType.HOLIDAY)
  @IsNotEmpty()
  @IsDateString()
  dateTo?: string;
}
