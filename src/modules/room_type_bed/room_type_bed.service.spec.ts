import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeBedService } from './room_type_bed.service';

describe('RoomTypeBedService', () => {
  let service: RoomTypeBedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomTypeBedService],
    }).compile();

    service = module.get<RoomTypeBedService>(RoomTypeBedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
