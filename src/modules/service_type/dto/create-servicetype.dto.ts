import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'Trường này không được để trống' })
  typeName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
