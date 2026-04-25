import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { BedType } from '../common/enums/bed-type.enum';

@Entity('room_bed')
export class RoomBed {
  @PrimaryGeneratedColumn()
  roomBedId: number;

  @Column()
  roomTypeId: number;

  @ManyToOne(() => RoomType, (rt) => rt.roomBeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @Column({ type: 'enum', enum: BedType })
  roomBedType: BedType;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
