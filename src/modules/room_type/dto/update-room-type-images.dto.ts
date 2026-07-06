import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRoomTypeImageDto {
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  altText?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isCover?: boolean;
}
