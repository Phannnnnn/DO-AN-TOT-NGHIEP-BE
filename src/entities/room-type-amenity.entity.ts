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

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;

  @ManyToOne(() => RoomType, (rt) => rt.roomTypeAmenities)
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @ManyToOne(() => RoomAmenity, (a) => a.roomTypeAmenities)
  @JoinColumn({ name: 'roomAmenityId' })
  roomAmenity: RoomAmenity;
}
