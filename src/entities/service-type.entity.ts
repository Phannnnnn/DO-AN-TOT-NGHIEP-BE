import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';

@Entity('service_types')
export class ServiceType {
  @PrimaryGeneratedColumn()
  serviceTypeId: number;

  @Column({ length: 100 })
  typeName: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Service, (service) => service.serviceType)
  services: Service[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
