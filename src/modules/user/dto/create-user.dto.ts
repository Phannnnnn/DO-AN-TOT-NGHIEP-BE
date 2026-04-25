import { IsEmpty, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Tên đăng nhập không được bỏ trống.' })
  @Length(6, 50, { message: 'Tên đăng nhập phải dài tối thiểu (6-50) kí tự.' })
  userName: string;

  @Length(8, 255, { message: 'Mật khẩu phải dài tối thiểu (8) ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Email không được bỏ trống.' })
  email: string;

  @IsNotEmpty({ message: 'Họ và tên không được bỏ trống.' })
  fullName: string;
}
