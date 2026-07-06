import { Test, TestingModule } from '@nestjs/testing';
import { BookingServiceService } from './booking_service.service';

describe('BookingServiceService', () => {
  let service: BookingServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingServiceService],
    }).compile();

    service = module.get<BookingServiceService>(BookingServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
