import { Test, TestingModule } from '@nestjs/testing';
import { RoomBedService } from './room_bed.service';

describe('RoomBedService', () => {
  let service: RoomBedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomBedService],
    }).compile();

    service = module.get<RoomBedService>(RoomBedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
