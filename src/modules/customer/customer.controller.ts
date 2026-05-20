import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  async customers() {
    return this.customerService.customers();
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

  @Delete(':id')
  remove(@Param('id') customerId: number) {
    return this.customerService.remove(customerId);
  }
}
