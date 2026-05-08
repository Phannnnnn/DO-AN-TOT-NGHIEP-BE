import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BedType } from '../common/enums/bed-type.enum';
import { RoomTypeBed } from './room-type-bed.entity';

@Entity('room_bed')
export class RoomBed {
  @PrimaryGeneratedColumn()
  roomBedId: number;

  @Column({ type: 'enum', enum: BedType })
  roomBedType: BedType;

  @OneToMany(() => RoomTypeBed, (rtb) => rtb.roomBed)
  roomTypeBeds: RoomTypeBed[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
