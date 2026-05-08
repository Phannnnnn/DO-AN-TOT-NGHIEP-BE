// price-plan.entity.ts
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
import { PricePlanType } from '../common/enums/price-plan-type.enum';

@Entity('price_plan')
export class PricePlan {
  @PrimaryGeneratedColumn()
  pricePlanId: number;

  @Column({ name: 'roomTypeId' })
  roomTypeId: number;

  @Column({ length: 100 })
  pricePlanName: string;

  @Column({ type: 'enum', enum: PricePlanType })
  type: PricePlanType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'date', nullable: true })
  dateFrom: string | null;

  @Column({ type: 'date', nullable: true })
  dateTo: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => RoomType, (rt) => rt.pricePlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  update_At: Date;
}
