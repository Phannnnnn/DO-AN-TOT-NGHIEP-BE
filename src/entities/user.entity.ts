import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  HOUSEKEEPING = 'HOUSEKEEPING',
  RECEPTIONIST = 'RECEPTIONIST',
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  userName: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  lastLogin: Date;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer: Customer;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;
}
