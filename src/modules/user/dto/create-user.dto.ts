import { IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(6, 50)
  userName: string;

  @Length(8, 255)
  password: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole;
}
