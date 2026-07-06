import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

export enum HousekeepingTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity('housekeeping_tasks')
export class HousekeepingTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ nullable: true })
  assignedTo: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: User;

  @Column({
    type: 'enum',
    enum: HousekeepingTaskStatus,
    default: HousekeepingTaskStatus.PENDING,
  })
  status: HousekeepingTaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
