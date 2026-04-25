import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsString()
  @Length(9, 20, { message: 'Số định danh phải từ 9 đến 20 ký tự' })
  @IsNotEmpty({ message: 'Số định danh (CCCD/CMND) là bắt buộc' })
  idNumber: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty({ message: 'SĐT không được bỏ trống.' })
  phone: string;

  @IsOptional()
  @MaxLength(100)
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày sinh phải theo định dạng ISO 8601 (YYYY-MM-DD)' },
  )
  dateOfBirth?: string;
}
