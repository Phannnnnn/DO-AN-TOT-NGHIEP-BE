import { Test, TestingModule } from '@nestjs/testing';
import { BedController } from './room_bed.controller';
import { RoomBedService } from './room_bed.service';

describe('RoomBedController', () => {
  let controller: BedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BedController],
      providers: [RoomBedService],
    }).compile();

    controller = module.get<BedController>(BedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
