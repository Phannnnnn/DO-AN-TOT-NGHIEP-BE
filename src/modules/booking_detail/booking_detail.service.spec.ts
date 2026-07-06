import { Test, TestingModule } from '@nestjs/testing';
import { BookingDetailService } from './booking_detail.service';

describe('BookingDetailService', () => {
  let service: BookingDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingDetailService],
    }).compile();

    service = module.get<BookingDetailService>(BookingDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
