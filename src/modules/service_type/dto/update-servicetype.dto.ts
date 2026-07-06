import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceTypeDto } from './create-servicetype.dto';

export class UpdateServiceTypeDto extends PartialType(CreateServiceTypeDto) {}
