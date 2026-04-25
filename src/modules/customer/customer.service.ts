import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../../entities/customer.entity';
import { Not, Repository } from 'typeorm';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { email, phone, idNumber } = createCustomerDto;

    if (email) {
      const existEmail = await this.customerRepository.findOneBy({ email });
      if (existEmail) {
        throw new ConflictException(
          'Email đã được sử dụng, vui lòng chọn email khác',
        );
      }
    }

    if (phone) {
      const existPhone = await this.customerRepository.findOneBy({ phone });
      if (existPhone) {
        throw new ConflictException(
          'SĐT đã được sử dụng, vui lòng chọn SĐT khác',
        );
      }
    }

    const existIdNumber = await this.customerRepository.findOneBy({ idNumber });
    if (existIdNumber) {
      throw new ConflictException(
        'CCCD/CMND đã được sử dụng, vui lòng kiểm tra lại',
      );
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  customers() {
    return this.customerRepository.find();
  }

  customerById(customerId: number) {
    return this.customerRepository.findOneBy({ customerId });
  }

  async update(customerId: number, updateCustomerDto: UpdateCustomerDto) {
    const { email, phone, idNumber } = updateCustomerDto;
    if (phone) {
      const existPhone = await this.customerRepository.findOne({
        where: { phone, customerId: Not(customerId) },
      });
      if (existPhone) {
        throw new ConflictException(
          'Số điện thoại này đã thuộc về khách hàng khác',
        );
      }
    }

    if (idNumber) {
      const existIdNumber = await this.customerRepository.findOne({
        where: { idNumber, customerId: Not(customerId) },
      });
      if (existIdNumber) {
        throw new ConflictException('Số CCCD này đã tồn tại trong hệ thống');
      }
    }

    const result = await this.customerRepository.update(
      customerId,
      updateCustomerDto,
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        `Không tìm thấy khách hàng có id = ${customerId} để cập nhật`,
      );
    }

    return this.customerRepository.findOneBy({
      customerId,
    });
  }

  remove(customerId: number) {
    return;
  }
}
