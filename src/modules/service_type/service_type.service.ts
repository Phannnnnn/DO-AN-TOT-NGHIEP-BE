import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceType } from '../../entities/service-type.entity';
import { Not, Repository } from 'typeorm';
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
    const { typeName, description } = updateServiceDto;

    const nameExist = await this.serviceTypeRepository.findOne({
      where: {
        typeName: updateServiceDto.typeName,
        serviceTypeId: Not(serviceTypeId),
      },
    });

    if (nameExist) {
      throw new ConflictException('Dịch vụ đã tồn tại trên hệ thống.');
    }

    const serviceType = await this.serviceTypeRepository.findOneBy({
      serviceTypeId,
    });

    if (!serviceType) {
      throw new NotFoundException('Loại dịch vụ không tồn tại trong hệ thống.');
    }

    Object.assign(serviceType, { typeName, description: description ?? '' });

    await this.serviceTypeRepository.save(serviceType);

    return this.serviceTypeRepository.findOne({ where: { serviceTypeId } });
  }

  async remove(serviceTypeId: number) {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { serviceTypeId: serviceTypeId },
      relations: { services: true },
    });
    if (!serviceType) {
      throw new NotFoundException('Loại dịch vụ không tồn tại trên hệ thống.');
    }
    await this.serviceTypeRepository.delete({ serviceTypeId });

    return serviceType;
  }
}
