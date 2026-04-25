import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingDetail } from './booking-detail.entity';
import { Service } from './service.entity';

@Entity('booking_services')
export class BookingServiceEntity {
  @PrimaryGeneratedColumn()
  bookingServiceId: number;

  @Column()
  bookingDetailId: number;

  @ManyToOne(() => BookingDetail, (detail) => detail.bookingServices)
  @JoinColumn({ name: 'bookingDetailId' })
  bookingDetail: BookingDetail;

  @Column()
  serviceId: number;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtUsage: number; // Lưu giá dịch vụ tại thời điểm sử dụng

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
