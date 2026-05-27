// src/vnpay/dto/create-payment.dto.ts
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
  amount: number; // Số tiền (VND)

  @IsString()
  @IsNotEmpty()
  orderId: string; // Mã đơn hàng (booking ID hoặc mã tham chiếu)

  @IsString()
  @IsNotEmpty()
  orderInfo: string; // Thông tin đơn hàng (mô tả)

  @IsString()
  @IsOptional()
  bankCode?: string; // Mã ngân hàng (tùy chọn)

  @IsString()
  @IsOptional()
  language?: string; // 'vn' hoặc 'en'

  @IsString()
  @IsOptional()
  ipAddress?: string; // IP khách hàng
}
