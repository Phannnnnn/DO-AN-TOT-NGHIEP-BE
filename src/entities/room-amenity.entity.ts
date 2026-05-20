import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomTypeAmenity } from './room-type-amenity.entity';
import { AmenityCategory } from '../common/enums/room-amenity-category.enum';

@Entity('room_amenity')
export class RoomAmenity {
  @PrimaryGeneratedColumn()
  roomAmenityId: number;

  @Column({ type: 'enum', enum: AmenityCategory })
  category: AmenityCategory;

  @Column()
  roomAmenityName: string;

  @OneToMany(() => RoomTypeAmenity, (rta) => rta.roomAmenity)
  roomTypeAmenities: RoomTypeAmenity[];

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
