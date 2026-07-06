import { PartialType } from '@nestjs/mapped-types';
import { CreatePricePlanDto } from './create-price-plan.dto';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PricePlanType } from '../../../common/enums/price-plan-type.enum';

export class UpdatePricePlanDto extends PartialType(CreatePricePlanDto) {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  pricePlanName?: string;

  @IsPositive()
  @IsOptional()
  basePrice?: number;

  @ValidateIf((o) => o.type === PricePlanType.HOLIDAY)
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ValidateIf((o) => o.type === PricePlanType.HOLIDAY)
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
