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

@Entity('room_image')
export class RoomImage {
  @PrimaryGeneratedColumn()
  roomImageId: number;

  @Column()
  roomTypeId: number;

  @ManyToOne(() => RoomType, (rt) => rt.roomImages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 200, nullable: true })
  altText: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isCover: boolean;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
