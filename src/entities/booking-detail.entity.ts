import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Room } from './room.entity';
import { BookingServiceEntity } from './booking-service.entity';

@Entity('booking_details')
export class BookingDetail {
  @PrimaryGeneratedColumn()
  bookingDetailId: number;

  @Column()
  bookingId: number;

  @Column()
  roomId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtBooking: number;

  @ManyToOne(() => Booking, (booking) => booking.bookingDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @OneToMany(() => BookingServiceEntity, (bs) => bs.bookingDetail, {
    cascade: true,
  })
  bookingServices: BookingServiceEntity[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
