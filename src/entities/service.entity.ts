import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceType } from './service-type.entity';

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

  @Column({ default: true })
  isActive: boolean;

  @Column()
  serviceTypeId: number;

  @ManyToOne(() => ServiceType, (type) => type.services)
  @JoinColumn({ name: 'serviceTypeId' })
  serviceType: ServiceType;

  //   @OneToMany(() => BookingService, (bs) => bs.service)
  //   bookingServices: BookingService[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
