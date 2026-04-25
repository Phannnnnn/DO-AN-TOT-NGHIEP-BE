import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  serviceName: string;

  @Min(0, { message: 'Giá không được nhỏ hơn 0' })
  price: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt({ message: 'ID loại phòng phải là số nguyên.' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Dịch phải thuộc về một loại dịch vụ.' })
  serviceTypeId: number;
}
