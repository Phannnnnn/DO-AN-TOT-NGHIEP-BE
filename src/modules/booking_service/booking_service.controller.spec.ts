import { Test, TestingModule } from '@nestjs/testing';
import { BookingServiceController } from './booking_service.controller';
import { BookingServiceService } from './booking_service.service';

describe('BookingServiceController', () => {
  let controller: BookingServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingServiceController],
      providers: [BookingServiceService],
    }).compile();

    controller = module.get<BookingServiceController>(BookingServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
