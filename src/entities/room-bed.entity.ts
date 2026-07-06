import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomTypeBed } from './room-type-bed.entity';

@Entity('room_bed')
export class RoomBed {
  @PrimaryGeneratedColumn()
  roomBedId: number;

  @Column()
  roomBedType: string;

  @Column({ default: 1 })
  capacity: number;

  @OneToMany(() => RoomTypeBed, (rtb) => rtb.roomBed)
  roomTypeBeds: RoomTypeBed[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
