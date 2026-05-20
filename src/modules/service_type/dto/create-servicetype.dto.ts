import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty()
  typeName: string;

  @IsString()
  @IsOptional()
  description?: string;
}
