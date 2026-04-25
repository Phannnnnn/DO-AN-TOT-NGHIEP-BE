import { Test, TestingModule } from '@nestjs/testing';
import { PricePlanService } from './price_plan.service';

describe('PricePlanService', () => {
  let service: PricePlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricePlanService],
    }).compile();

    service = module.get<PricePlanService>(PricePlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
