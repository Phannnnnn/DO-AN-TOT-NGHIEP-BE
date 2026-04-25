import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceType } from '../../entities/service-type.entity';
import { Repository } from 'typeorm';
import { CreateServiceTypeDto } from './dto/create-servicetype.dto';
import { UpdateServiceTypeDto } from './dto/update-servicetype.dto';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async create(createServicetypeDto: CreateServiceTypeDto) {
    const serviceType = this.serviceTypeRepository.create(createServicetypeDto);
    return this.serviceTypeRepository.save(serviceType);
  }

  serviceTypes() {
    return this.serviceTypeRepository.find({ relations: { services: true } });
  }

  serviceTypeById(serviceTypeId: number) {
    return this.serviceTypeRepository.findOne({
      where: { serviceTypeId: serviceTypeId },
      relations: { services: true },
    });
  }

  async update(serviceTypeId: number, updateServiceDto: UpdateServiceTypeDto) {
    const existServiceType = await this.serviceTypeRepository.findOneBy({
      serviceTypeId,
    });

    if (!existServiceType) {
      throw new NotFoundException('Loại dịch vụ không tồn tại trong hệ thống.');
    }

    const resutl = await this.serviceTypeRepository.update(
      serviceTypeId,
      updateServiceDto,
    );

    if (resutl.affected) {
      return this.serviceTypeRepository.findOneBy({ serviceTypeId });
    }
    return null;
  }

  async remove() {
    return;
  }
}
