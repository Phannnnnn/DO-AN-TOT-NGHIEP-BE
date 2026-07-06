import { Test, TestingModule } from '@nestjs/testing';
import { RoomAmenityService } from './room-amenity.service';

describe('RoomAmenityService', () => {
  let service: RoomAmenityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomAmenityService],
    }).compile();

    service = module.get<RoomAmenityService>(RoomAmenityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
