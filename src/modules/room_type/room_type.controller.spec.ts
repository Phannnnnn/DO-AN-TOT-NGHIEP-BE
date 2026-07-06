import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeController } from './room_type.controller';
import { RoomTypeService } from './room_type.service';

describe('RoomTypeController', () => {
  let controller: RoomTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTypeController],
      providers: [RoomTypeService],
    }).compile();

    controller = module.get<RoomTypeController>(RoomTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
