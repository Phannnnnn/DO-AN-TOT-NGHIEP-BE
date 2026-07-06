import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_guests')
export class BookingGuest {
  @PrimaryGeneratedColumn()
  bookingGuestId: number;

  @Column()
  bookingId: number;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 20 })
  idNumber: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, default: 'Việt Nam' })
  nationality: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string;

  @CreateDateColumn()
  created_At: Date;
}
