import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../../entities/customer.entity';
import { Repository } from 'typeorm';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersQueryDto } from './dto/customers-query.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const emailExits = await this.customerRepository.exists({
      where: { email: createCustomerDto.email },
    });

    if (emailExits) {
      throw new ConflictException('Email đã tồn tại.');
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findByEmail(email: string) {
    return this.customerRepository.findOne({ where: { email } });
  }

  async customers(customersQueryDto: CustomersQueryDto) {
    const [customers, totalRecords] =
      await this.customerRepository.findAndCount({
        take: Number(customersQueryDto.limit),
        skip:
          (Number(customersQueryDto.page) - 1) *
          Number(customersQueryDto.limit),
      });

    const totalPage = Math.ceil(totalRecords / Number(customersQueryDto.limit));

    return {
      customers,
      totalPage,
    };
  }

  async customerById(customerId: number) {
    const customer = await this.customerRepository.findOneBy({ customerId });
    if (!customer) {
      throw new NotFoundException('Người dùng không tồn tại trên hệ thống.');
    }
    return customer;
  }

  async update(customerId: number, updateCustomerDto: UpdateCustomerDto) {
    await this.customerById(customerId);

    await this.customerRepository.update(customerId, updateCustomerDto);

    return this.customerRepository.findOneBy({
      customerId,
    });
  }

  async remove(customerId: number) {
    const customer = await this.customerRepository.findOneBy({ customerId });
    if (!customer) {
      throw new NotFoundException('Người dùng không tồn tại trên hệ thống.');
    }

    await this.customerRepository.softDelete(customerId);

    return customer;
  }
}
