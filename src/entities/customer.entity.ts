import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export const DEFAULT_AVATAR_URL =
  'https://res.cloudinary.com/dr0mi2dui/image/upload/v1781098787/avatars/ievfhmiaxyohgj6sdsnz.jpg';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  customerId: number;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, default: 'Việt Nam' })
  nationality: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: DEFAULT_AVATAR_URL,
  })
  avatar: string | null;

  @OneToOne(() => User, (user) => user.customer, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
