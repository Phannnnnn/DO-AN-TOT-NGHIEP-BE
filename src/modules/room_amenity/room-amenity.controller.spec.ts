import { Test, TestingModule } from '@nestjs/testing';
import { RoomAmenityController } from './room-amenity.controller';
import { RoomAmenityService } from './room-amenity.service';

describe('RoomAmenityController', () => {
  let controller: RoomAmenityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomAmenityController],
      providers: [RoomAmenityService],
    }).compile();

    controller = module.get<RoomAmenityController>(RoomAmenityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
