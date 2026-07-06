import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeBedController } from './room_type_bed.controller';
import { RoomTypeBedService } from './room_type_bed.service';

describe('RoomTypeBedController', () => {
  let controller: RoomTypeBedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTypeBedController],
      providers: [RoomTypeBedService],
    }).compile();

    controller = module.get<RoomTypeBedController>(RoomTypeBedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
