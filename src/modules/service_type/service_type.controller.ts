import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ServiceTypeService } from './service_type.service';
import { CreateServiceTypeDto } from './dto/create-servicetype.dto';
import { UpdateServiceTypeDto } from './dto/update-servicetype.dto';

@Controller('service-type')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  @Post()
  async create(@Body() createServicetypeDto: CreateServiceTypeDto) {
    const serviceType =
      await this.serviceTypeService.create(createServicetypeDto);
    if (serviceType) {
      return { success: true, serviceType };
    }
    return { success: false, message: 'Đã xảy ra lỗi.' };
  }

  @Get()
  async serviceTypes() {
    const serviceTypes = await this.serviceTypeService.serviceTypes();
    if (serviceTypes) {
      return { success: true, serviceTypes };
    }
    return { success: false, message: 'Đã xảy ra lỗi.' };
  }

  @Get(':id')
  async serviceTypeById(@Param('id') serviceTypeId: number) {
    const serviceType =
      await this.serviceTypeService.serviceTypeById(serviceTypeId);
    if (serviceType) {
      return { success: true, serviceType };
    }
    return { success: false, message: 'Đã xảy ra lỗi.' };
  }

  @Patch(':id')
  async update(
    @Param('id') serviceTypeId: number,
    @Body()
    updateServiceDto: UpdateServiceTypeDto,
  ) {
    const serviceType = await this.serviceTypeService.update(
      serviceTypeId,
      updateServiceDto,
    );
    if (serviceType) {
      return { success: true, serviceType };
    }
    return { success: false, message: 'Đã xảy ra lỗi.' };
  }
}
