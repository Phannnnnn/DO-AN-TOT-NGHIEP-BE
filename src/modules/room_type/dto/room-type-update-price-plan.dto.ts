import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PricePlanType } from '../../../common/enums/price-plan-type.enum';
export class RoomTypeUpdatePricePlanDto {
  @IsInt()
  @IsOptional()
  pricePlanId?: number;
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pricePlanName: string;
  @IsEnum(PricePlanType)
  type: PricePlanType;
  @IsPositive()
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
