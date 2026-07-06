import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { BookingGuestDto } from './booking-guest.dto';
import { Type } from 'class-transformer';

export class CheckInDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  guests: BookingGuestDto[];
}
