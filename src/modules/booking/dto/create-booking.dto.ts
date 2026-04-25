import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateBookingDetailDto } from '../../booking_detail/dto/create-booking-detail.dto';

export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  customerId: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingDetailDto)
  bookingDetails: CreateBookingDetailDto[];
}
