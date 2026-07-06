import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../../entities/service.entity';
import { ServiceType } from '../../entities/service-type.entity';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService],
  imports: [TypeOrmModule.forFeature([Service, ServiceType])],
})
export class ServiceModule {}
