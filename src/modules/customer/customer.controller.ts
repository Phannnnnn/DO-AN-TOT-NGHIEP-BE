import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CustomersQueryDto } from './dto/customers-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Get()
  async customers(@Query() query: CustomersQueryDto) {
    return this.customerService.customers({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    });
  }

  @Get(':id')
  async customerById(@Param('id') customerId: number) {
    return this.customerService.customerById(customerId);
  }

  @Patch(':id')
  async update(
    @Param('id') customerId: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(customerId, updateCustomerDto);
  }

  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') customerId: number) {
    return this.customerService.remove(customerId);
  }
}
