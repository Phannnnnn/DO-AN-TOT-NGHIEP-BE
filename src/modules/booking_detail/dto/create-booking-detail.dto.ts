import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { CreateBookingServiceDto } from '../../booking_service/dto/create-booking-service.dto';

export class CreateBookingDetailDto {
  @IsInt()
  @IsPositive()
  roomId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingServiceDto)
  services?: CreateBookingServiceDto[];
}
