import { Test, TestingModule } from '@nestjs/testing';
import { PricePlanController } from './price_plan.controller';
import { PricePlanService } from './price_plan.service';

describe('PricePlanController', () => {
  let controller: PricePlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricePlanController],
      providers: [PricePlanService],
    }).compile();

    controller = module.get<PricePlanController>(PricePlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
