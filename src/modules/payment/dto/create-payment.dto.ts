import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;
  @IsString()
  @IsNotEmpty()
  orderId: string;
  @IsString()
  @IsNotEmpty()
  orderInfo: string;
  @IsString()
  @IsOptional()
  bankCode?: string;
  @IsString()
  @IsOptional()
  language?: string;
  @IsString()
  @IsOptional()
  ipAddress?: string;
}
