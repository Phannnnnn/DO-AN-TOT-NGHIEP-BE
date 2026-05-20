import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BookingDetail } from './booking-detail.entity';
import { BookingGuest } from './booking-guest.entity';
import { Customer } from './customer.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  bookingId: number;

  @Column({ nullable: true })
  customerId: number;

  @Column({ length: 100, nullable: true })
  guestName: string;

  @Column({ length: 20, nullable: true })
  guestPhone: string;

  @Column({ length: 100, nullable: true })
  guestEmail: string;

  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date' })
  checkOutDate: string;

  @Column({ type: 'datetime', nullable: true })
  actualCheckIn: Date;

  @Column({ type: 'datetime', nullable: true })
  actualCheckOut: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ length: 50, nullable: true })
  vnpayTransactionId: string;

  @OneToMany(() => BookingDetail, (detail) => detail.booking, { cascade: true })
  bookingDetails: BookingDetail[];

  @OneToMany(() => BookingGuest, (guest) => guest.booking, { cascade: true })
  guests: BookingGuest[];

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
