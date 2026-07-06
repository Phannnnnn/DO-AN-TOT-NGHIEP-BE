import { Test, TestingModule } from '@nestjs/testing';
import { RoomHoldController } from './room_hold.controller';
import { RoomHoldService } from './room_hold.service';

describe('RoomHoldController', () => {
  let controller: RoomHoldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomHoldController],
      providers: [RoomHoldService],
    }).compile();

    controller = module.get<RoomHoldController>(RoomHoldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
