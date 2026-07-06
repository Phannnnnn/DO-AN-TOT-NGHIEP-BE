import { Test, TestingModule } from '@nestjs/testing';
import { RoomHoldService } from './room_hold.service';

describe('RoomHoldService', () => {
  let service: RoomHoldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomHoldService],
    }).compile();

    service = module.get<RoomHoldService>(RoomHoldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
