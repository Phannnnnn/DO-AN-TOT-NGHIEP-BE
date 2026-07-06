import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeAmenityService } from './room_type_amenity.service';

describe('RoomTypeAmenityService', () => {
  let service: RoomTypeAmenityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomTypeAmenityService],
    }).compile();

    service = module.get<RoomTypeAmenityService>(RoomTypeAmenityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
