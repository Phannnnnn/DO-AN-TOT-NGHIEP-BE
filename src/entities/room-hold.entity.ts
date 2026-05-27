import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('room_hold')
export class RoomHold {
  @PrimaryGeneratedColumn()
  roomHoldId: number;

  @Column()
  roomId: number;

  @Column({ length: 100 })
  sessionId: string;

  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date' })
  checkOutDate: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}