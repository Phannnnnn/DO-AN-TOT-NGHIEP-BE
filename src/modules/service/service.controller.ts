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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.USER)
  @Get()
  async services() {
    return this.serviceService.services();
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.USER)
  @Get(':id')
  async serviceById(@Param('id') serviceId: number) {
    return this.serviceService.serviceById(serviceId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') serviceId: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.serviceService.update(serviceId, updateServiceDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') serviceId: number) {
    return this.serviceService.remove(serviceId);
  }
}
