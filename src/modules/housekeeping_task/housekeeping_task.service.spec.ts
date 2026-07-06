import { Test, TestingModule } from '@nestjs/testing';
import { HousekeepingService } from './housekeeping_task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  HousekeepingTask,
  HousekeepingTaskStatus,
} from '../../entities/housekeeping-task.entity';
import { Room } from '../../entities/room.entity';
import { Repository } from 'typeorm';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from '../../common/enums/room-status.enum';
describe('HousekeepingService', () => {
  let service: HousekeepingService;
  let taskRepository: jest.Mocked<Repository<HousekeepingTask>>;
  let roomRepository: jest.Mocked<Repository<Room>>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousekeepingService,
        {
          provide: getRepositoryToken(HousekeepingTask),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Room),
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<HousekeepingService>(HousekeepingService);
    taskRepository = module.get(getRepositoryToken(HousekeepingTask));
    roomRepository = module.get(getRepositoryToken(Room));
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('claimTask', () => {
    it('should claim task successfully if user has no active tasks', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.PENDING,
        roomId: 101,
        assignedTo: null,
      } as HousekeepingTask;
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockTask,
          status: HousekeepingTaskStatus.IN_PROGRESS,
          assignedTo: 2,
        });
      await service.claimTask(1, 2);
      expect(taskRepository.save).toHaveBeenCalled();
      expect(roomRepository.update).toHaveBeenCalledWith(101, {
        status: RoomStatus.PROGRESS,
      });
    });
    it('should throw ConflictException if task is already in progress', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.IN_PROGRESS,
        roomId: 101,
      } as HousekeepingTask;
      taskRepository.findOne.mockResolvedValueOnce(mockTask);
      await expect(service.claimTask(1, 2)).rejects.toThrow(ConflictException);
    });
    it('should throw ConflictException if user already has an active task', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.PENDING,
        roomId: 101,
      } as HousekeepingTask;
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ id: 2 } as HousekeepingTask);
      await expect(service.claimTask(1, 2)).rejects.toThrow(ConflictException);
    });
  });
  describe('completeTask', () => {
    it('should complete task successfully if user is the assignee', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.IN_PROGRESS,
        roomId: 101,
        assignedTo: 2,
      } as HousekeepingTask;
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({
          ...mockTask,
          status: HousekeepingTaskStatus.DONE,
        });
      await service.completeTask(1, 2);
      expect(taskRepository.save).toHaveBeenCalled();
      expect(roomRepository.update).toHaveBeenCalledWith(101, {
        status: RoomStatus.AVAILABLE,
      });
    });
    it('should throw BadRequestException if user is not the assignee', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.IN_PROGRESS,
        roomId: 101,
        assignedTo: 3,
      } as HousekeepingTask;
      taskRepository.findOne.mockResolvedValueOnce(mockTask);
      await expect(service.completeTask(1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw BadRequestException if task is not in progress', async () => {
      const mockTask = {
        id: 1,
        status: HousekeepingTaskStatus.PENDING,
        roomId: 101,
      } as HousekeepingTask;
      taskRepository.findOne.mockResolvedValueOnce(mockTask);
      await expect(service.completeTask(1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
