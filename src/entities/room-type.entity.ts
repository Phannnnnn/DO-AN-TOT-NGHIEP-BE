import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { RoomBed } from './room-bed.entity';
import { RoomImage } from './room-image.entity';
import { RoomTypeAmenity } from './room-type-amenity.entity';
import { PricePlan } from './price-plan.entity';

@Entity('room_type')
export class RoomType {
  @PrimaryGeneratedColumn()
  roomTypeId: number;

  @Column({ length: 100 })
  typeName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
  maxOccupancy: number;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;

  @OneToMany(() => Room, (room) => room.roomType)
  rooms: Room[];

  @OneToMany(() => RoomBed, (bed) => bed.roomType)
  roomBeds: RoomBed[];

  @OneToMany(() => RoomImage, (img) => img.roomType)
  roomImages: RoomImage[];

  @OneToMany(() => RoomTypeAmenity, (rta) => rta.roomType)
  roomTypeAmenities: RoomTypeAmenity[];

  @OneToMany(() => PricePlan, (plan) => plan.roomType)
  pricePlans: PricePlan[];
}
