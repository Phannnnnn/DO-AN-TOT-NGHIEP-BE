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
} from 'class-validator';

export class UpdatePricePlanDto extends PartialType(CreatePricePlanDto) {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  pricePlanName?: string;

  @IsPositive()
  @IsOptional()
  basePrice?: number;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
