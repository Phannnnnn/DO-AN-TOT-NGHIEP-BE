import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../../entities/service.entity';
import { Not, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceType } from '../../entities/service-type.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async create(createServiceDto: CreateServiceDto) {
    const serviceExist = await this.serviceRepository.existsBy({
      serviceName: createServiceDto.serviceName,
    });

    if (serviceExist) {
      throw new ConflictException('Dịch vụ đã tồn tại trên hệ thống.');
    }
    const { serviceTypeId } = createServiceDto;
    const serviceType = await this.serviceTypeRepository.existsBy({
      serviceTypeId,
    });

    if (!serviceType) {
      throw new NotFoundException('Loại dịch vụ không tồn tại trong hệ thống.');
    }

    const service = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(service);
  }

  services() {
    return this.serviceRepository.find({ relations: { serviceType: true } });
  }

  serviceById(serviceId: number) {
    return this.serviceRepository.findOne({
      where: { serviceId: serviceId },
      relations: { serviceType: true },
    });
  }

  async update(serviceId: number, updateServiceDto: UpdateServiceDto) {
    const { serviceName, serviceTypeId, ...otherData } = updateServiceDto;
    const serviceExist = await this.serviceRepository.existsBy({
      serviceId,
    });
    if (!serviceExist) {
      throw new NotFoundException('Dịch vụ không tồn tại.');
    }

    if (serviceName) {
      const serviceExist = await this.serviceRepository.exists({
        where: {
          serviceName: serviceName,
          serviceId: Not(serviceId),
        },
      });
      if (serviceExist) {
        throw new ConflictException('Dịch vụ trùng tên với dịch vụ khác.');
      }
    }

    if (serviceTypeId !== undefined) {
      const serviceType = await this.serviceTypeRepository.existsBy({
        serviceTypeId,
      });
      if (!serviceType) {
        throw new NotFoundException('Loại dịch vụ không tồn tại.');
      }
    }

    await this.serviceRepository.update(serviceId, {
      ...otherData,
      ...(serviceName && { serviceName }),
      ...(serviceTypeId && { serviceTypeId }),
    });

    return this.serviceRepository.findOne({
      where: { serviceId },
      relations: { serviceType: true },
    });
  }

  remove(serviceId: number) {
    return;
  }
}
