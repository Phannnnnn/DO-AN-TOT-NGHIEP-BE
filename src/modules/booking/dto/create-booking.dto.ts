import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  IsNotEmpty,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { CreateBookingDetailDto } from '../../booking_detail/dto/create-booking-detail.dto';

export class CreateBookingDto {
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  guestName: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsEmail()
  guestEmail: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  ipAddr?: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingDetailDto)
  bookingDetails: CreateBookingDetailDto[];
}
