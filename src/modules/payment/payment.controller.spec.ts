import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            createPaymentUrl: jest.fn(),
            handleIpn: jest.fn(),
            payCash: jest.fn(),
            payServiceCash: jest.fn(),
            createServicePaymentUrl: jest.fn(),
            handleServiceIpn: jest.fn(),
            verifyPaymentReturn: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyReturn', () => {
    it('should call paymentService.verifyPaymentReturn', async () => {
      const mockQuery = { vnp_TxnRef: '123' };
      service.verifyPaymentReturn.mockResolvedValueOnce({
        bookingId: 123,
      } as any);

      const result = await controller.verifyReturn(mockQuery);
      expect(result).toEqual({ bookingId: 123 });
      expect(service.verifyPaymentReturn).toHaveBeenCalledWith(mockQuery);
    });
  });
});
