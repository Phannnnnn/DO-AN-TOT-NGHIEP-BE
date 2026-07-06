import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { RoomBed } from './room-bed.entity';

@Entity('room_type_bed')
export class RoomTypeBed {
  @PrimaryColumn()
  roomBedId: number;

  @PrimaryColumn()
  roomTypeId: number;

  @Column({ default: 1 })
  quantity: number;

  @ManyToOne(() => RoomType, (rt) => rt.roomTypeBed, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @ManyToOne(() => RoomBed, (rb) => rb.roomTypeBeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomBedId' })
  roomBed: RoomBed;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
