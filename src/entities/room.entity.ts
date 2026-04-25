import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { RoomStatus } from '../common/enums/room-status.enum';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  roomId: number;

  @Column({ unique: true })
  roomNumber: string;

  @Column({ type: 'int' })
  floor: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;

  @Column()
  roomTypeId: number;

  // Quan hệ N-1: Nhiều phòng thuộc về một loại phòng
  @ManyToOne(() => RoomType, (roomType) => roomType.rooms)
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;
}
