import { IsInt, IsPositive, IsOptional, Min } from 'class-validator';

export class CreateBookingServiceDto {
  @IsInt()
  @IsPositive()
  serviceId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
