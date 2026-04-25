import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customerService.create(createCustomerDto);
    if (customer) {
      return { success: true, customer };
    }
    return { success: false, message: 'Đã sảy ra lỗi.' };
  }

  @Get()
  async customers() {
    const customers = await this.customerService.customers();
    if (customers) {
      return { success: true, customers };
    }
    return { success: false, message: 'Đã sảy ra lỗi.' };
  }

  @Get(':id')
  async customerById(@Param('id') customerId: number) {
    const customer = await this.customerService.customerById(customerId);
    if (customer) {
      return { success: true, customer };
    }
    return { success: false, message: 'Đã sảy ra lỗi.' };
  }

  @Patch(':id')
  async update(
    @Param('id') customerId: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.customerService.update(
      customerId,
      updateCustomerDto,
    );

    if (customer) {
      return { success: true, customer };
    }
    return { success: false, message: 'Đã sảy ra lỗi.' };
  }
}
