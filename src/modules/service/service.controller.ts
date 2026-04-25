import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    const service = await this.serviceService.create(createServiceDto);
    if (service) {
      return { success: true, service };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Get()
  async services() {
    const services = await this.serviceService.services();
    if (services) {
      return { success: true, services };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Get(':id')
  async serviceById(@Param('id') serviceId: number) {
    const service = await this.serviceService.serviceById(serviceId);
    if (service) {
      return { success: true, service };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }

  @Patch(':id')
  async update(
    @Param('id') serviceId: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.serviceService.update(
      serviceId,
      updateServiceDto,
    );
    if (service) {
      return { success: true, service };
    }
    return { success: false, message: 'Đã sảy ra lỗi' };
  }
}
