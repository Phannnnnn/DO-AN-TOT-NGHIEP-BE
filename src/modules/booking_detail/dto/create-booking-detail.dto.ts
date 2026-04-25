import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsDateString,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { CreateBookingServiceDto } from '../../booking_service/dto/create-booking-service.dto';

export class CreateBookingDetailDto {
  @IsInt()
  @IsPositive()
  roomId: number;

  @IsDateString()
  checkInPlan: string;

  @IsDateString()
  checkOutPlan: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingServiceDto)
  services?: CreateBookingServiceDto[];
}
