import { Module } from '@nestjs/common';
import { ServiceTypeService } from './service_type.service';
import { ServiceTypeController } from './service_type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceType } from '../../entities/service-type.entity';
import { Service } from '../../entities/service.entity';

@Module({
  controllers: [ServiceTypeController],
  providers: [ServiceTypeService],
  imports: [TypeOrmModule.forFeature([ServiceType, Service])],
})
export class ServiceTypeModule {}
