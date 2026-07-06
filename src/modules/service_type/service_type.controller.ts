import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ServiceTypeService } from './service_type.service';
import { CreateServiceTypeDto } from './dto/create-servicetype.dto';
import { UpdateServiceTypeDto } from './dto/update-servicetype.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-type')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  @Roles(UserRole.ADMIN)
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

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') serviceTypeId: number,
    @Body()
    updateServiceDto: UpdateServiceTypeDto,
  ) {
    return this.serviceTypeService.update(serviceTypeId, updateServiceDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') serviceTypeId: number) {
    return this.serviceTypeService.remove(serviceTypeId);
  }
}
