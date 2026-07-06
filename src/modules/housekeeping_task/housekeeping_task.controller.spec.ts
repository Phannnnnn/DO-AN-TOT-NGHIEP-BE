import { Test, TestingModule } from '@nestjs/testing';
import { HousekeepingController } from './housekeeping_task.controller';
import { HousekeepingService } from './housekeeping_task.service';

describe('HousekeepingController', () => {
  let controller: HousekeepingController;
  let service: jest.Mocked<HousekeepingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HousekeepingController],
      providers: [
        {
          provide: HousekeepingService,
          useValue: {
            getTasks: jest.fn(),
            claimTask: jest.fn(),
            completeTask: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HousekeepingController>(HousekeepingController);
    service = module.get(HousekeepingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
