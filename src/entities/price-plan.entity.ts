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

@Entity('price_plan')
export class PricePlan {
  @PrimaryGeneratedColumn()
  pricePlanId: number;

  @Column({ name: 'roomTypeId' })
  roomTypeId: number;

  @ManyToOne(() => RoomType, (rt) => rt.pricePlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @Column({ length: 100 })
  pricePlanName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'date', nullable: true })
  dateFrom: string | null;

  @Column({ name: 'date_to', type: 'date', nullable: true })
  dateTo: string | null;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
