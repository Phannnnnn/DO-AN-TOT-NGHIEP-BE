import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { RoomAmenity } from './room-amenity.entity';

@Entity('room_type_amenity')
export class RoomTypeAmenity {
  @PrimaryColumn()
  roomTypeId: number;

  @PrimaryColumn()
  roomAmenityId: number;

  @ManyToOne(() => RoomType, (rt) => rt.roomTypeAmenities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @ManyToOne(() => RoomAmenity, (a) => a.roomTypeAmenities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomAmenityId' })
  roomAmenity: RoomAmenity;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
