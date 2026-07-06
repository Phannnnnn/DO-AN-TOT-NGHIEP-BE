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
@Entity('booking_services')
export class BookingServiceEntity {
  @PrimaryGeneratedColumn()
  bookingServiceId: number;

  @Column()
  bookingDetailId: number;

  @ManyToOne(() => BookingDetail, (detail) => detail.bookingServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingDetailId' })
  bookingDetail: BookingDetail;

  @Column({ length: 100 })
  serviceName: string;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ nullable: true })
  serviceId: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtUsage: number;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
