import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeAmenityController } from './room_type_amenity.controller';
import { RoomTypeAmenityService } from './room_type_amenity.service';

describe('RoomTypeAmenityController', () => {
  let controller: RoomTypeAmenityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTypeAmenityController],
      providers: [RoomTypeAmenityService],
    }).compile();

    controller = module.get<RoomTypeAmenityController>(
      RoomTypeAmenityController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
