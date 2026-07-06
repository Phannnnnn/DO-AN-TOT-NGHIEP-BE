import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt({ message: 'ID loại phòng phải là số nguyên.' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Dịch phải thuộc về một loại dịch vụ.' })
  serviceTypeId: number;
}
