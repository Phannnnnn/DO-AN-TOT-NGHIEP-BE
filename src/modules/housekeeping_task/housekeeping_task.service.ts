import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HousekeepingTask,
  HousekeepingTaskStatus,
} from '../../entities/housekeeping-task.entity';
import { Room } from '../../entities/room.entity';
import { RoomStatus } from '../../common/enums/room-status.enum';
@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly taskRepository: Repository<HousekeepingTask>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}
  async getTasks() {
    return this.taskRepository.find({
      where: [
        { status: HousekeepingTaskStatus.PENDING },
        { status: HousekeepingTaskStatus.IN_PROGRESS },
      ],
      relations: { room: true, assignedUser: { customer: true } },
      order: { createdAt: 'ASC' },
    });
  }
  async getActiveTask(roomId: number) {
    const task = await this.taskRepository.findOne({
      where: [
        { roomId, status: HousekeepingTaskStatus.PENDING },
        { roomId, status: HousekeepingTaskStatus.IN_PROGRESS },
      ],
    });
    if (task) {
      throw new ConflictException('Phòng đang được dọn.');
    }
    return task;
  }
  async createTask(roomId: number): Promise<HousekeepingTask> {
    const existing = await this.taskRepository.findOne({
      where: [
        { roomId, status: HousekeepingTaskStatus.PENDING },
        { roomId, status: HousekeepingTaskStatus.IN_PROGRESS },
      ],
    });
    if (existing) return existing;
    const task = this.taskRepository.create({ roomId });
    return this.taskRepository.save(task);
  }
  async claimTask(taskId: number, userId: number) {
    const task = await this.findTaskById(taskId);
    if (task.status !== HousekeepingTaskStatus.PENDING) {
      throw new ConflictException(
        task.status === HousekeepingTaskStatus.IN_PROGRESS
          ? 'Phòng này đang được dọn bởi nhân viên khác.'
          : 'Task này đã hoàn thành.',
      );
    }
    const activeTask = await this.taskRepository.findOne({
      where: {
        assignedTo: userId,
        status: HousekeepingTaskStatus.IN_PROGRESS,
      },
    });
    if (activeTask) {
      throw new ConflictException(
        'Bạn đang có nhiệm vụ chưa hoàn thành. Vui lòng hoàn thành nhiệm vụ hiện tại trước khi nhận nhiệm vụ mới.',
      );
    }
    task.assignedTo = userId;
    task.status = HousekeepingTaskStatus.IN_PROGRESS;
    task.startedAt = new Date();
    await this.roomRepository.update(task.roomId, {
      status: RoomStatus.PROGRESS,
    });
    await this.taskRepository.save(task);
    return this.taskRepository.findOne({
      where: { id: taskId },
      relations: { room: true, assignedUser: { customer: true } },
    });
  }
  async completeTask(taskId: number, userId: number) {
    const task = await this.findTaskById(taskId);
    if (task.status !== HousekeepingTaskStatus.IN_PROGRESS) {
      throw new BadRequestException(
        task.status === HousekeepingTaskStatus.PENDING
          ? 'Phòng chưa được nhận dọn.'
          : 'Task này đã hoàn thành.',
      );
    }
    if (task.assignedTo !== userId) {
      throw new BadRequestException('Bạn không phụ trách phòng này.');
    }
    task.status = HousekeepingTaskStatus.DONE;
    task.completedAt = new Date();
    await this.roomRepository.update(task.roomId, {
      status: RoomStatus.AVAILABLE,
    });
    await this.taskRepository.save(task);
    return this.taskRepository.findOne({
      where: { id: taskId },
      relations: { room: true, assignedUser: { customer: true } },
    });
  }
  private async findTaskById(taskId: number): Promise<HousekeepingTask> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: { room: true },
    });
    if (!task) {
      throw new NotFoundException(`Không tìm thấy task.`);
    }
    return task;
  }
}
