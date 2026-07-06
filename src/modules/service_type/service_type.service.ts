import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceType } from '../../entities/service-type.entity';
import { Not, Repository } from 'typeorm';
import { CreateServiceTypeDto } from './dto/create-servicetype.dto';
import { UpdateServiceTypeDto } from './dto/update-servicetype.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Service } from '../../entities/service.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
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

    const inUse = await this.serviceRepository.count({
      where: { serviceTypeId: serviceTypeId },
      withDeleted: true,
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Không thể xóa: có ${inUse} dịch vụ đang dùng loại này`,
      );
    }

    await this.serviceTypeRepository.delete({ serviceTypeId });

    return serviceType;
  }
}
