import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServiceTypeService } from './service_type.service';
import { CreateServiceTypeDto } from './dto/create-servicetype.dto';
import { UpdateServiceTypeDto } from './dto/update-servicetype.dto';

@Controller('service-type')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  @Post()
  async create(@Body() createServicetypeDto: CreateServiceTypeDto) {
    return this.serviceTypeService.create(createServicetypeDto);
  }

  @Get()
  async serviceTypes() {
    return this.serviceTypeService.serviceTypes();
  }

  @Get(':id')
  async serviceTypeById(@Param('id') serviceTypeId: number) {
    return this.serviceTypeService.serviceTypeById(serviceTypeId);
  }

  @Patch(':id')
  async update(
    @Param('id') serviceTypeId: number,
    @Body()
    updateServiceDto: UpdateServiceTypeDto,
  ) {
    return this.serviceTypeService.update(serviceTypeId, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') serviceTypeId: number) {
    return this.serviceTypeService.remove(serviceTypeId);
  }
}
