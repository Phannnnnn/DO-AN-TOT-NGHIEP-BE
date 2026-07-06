import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceType } from './service-type.entity';
import { BookingServiceEntity } from './booking-service.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  serviceId: number;

  @Column({ unique: true })
  serviceName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  serviceTypeId: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ServiceType, (type) => type.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceTypeId' })
  serviceType: ServiceType;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
