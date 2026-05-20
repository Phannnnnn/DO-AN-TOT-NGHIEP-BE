import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  async services() {
    return this.serviceService.services();
  }

  @Get(':id')
  async serviceById(@Param('id') serviceId: number) {
    return this.serviceService.serviceById(serviceId);
  }

  @Patch(':id')
  async update(
    @Param('id') serviceId: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.serviceService.update(serviceId, updateServiceDto);
  }

  @Delete(':id')
  async remove(@Param('id') serviceId: number) {
    return this.serviceService.remove(serviceId);
  }
}
