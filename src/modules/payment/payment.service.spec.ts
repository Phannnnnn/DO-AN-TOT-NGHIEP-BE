import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingService } from '../booking/booking.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let bookingServiceMock: jest.Mocked<BookingService>;

  beforeEach(async () => {
    process.env.VNPAY_TMN_CODE = 'TEST_TMN';
    process.env.VNPAY_HASH_SECRET = 'TEST_SECRET';
    process.env.VNPAY_URL = 'http://test.vnpay.vn';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: BookingService,
          useValue: {
            bookingById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPaymentConfirmation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    bookingServiceMock = module.get(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyPaymentReturn', () => {
    it('should throw BadRequestException if signature is invalid', async () => {
      jest.spyOn(service['vnpay'], 'verifyReturnUrl').mockReturnValue({
        isVerified: false,
        isSuccess: false,
        message: 'Invalid signature',
      } as any);

      await expect(service.verifyPaymentReturn({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return booking details if signature is valid', async () => {
      const mockQuery = { vnp_TxnRef: '123' };
      const mockBooking = { bookingId: 123, totalAmount: 100 };

      jest.spyOn(service['vnpay'], 'verifyReturnUrl').mockReturnValue({
        isVerified: true,
        isSuccess: true,
        vnp_TxnRef: '123',
      } as any);

      bookingServiceMock.bookingById.mockResolvedValueOnce(mockBooking as any);

      const result = await service.verifyPaymentReturn(mockQuery);
      expect(result).toEqual(mockBooking);
      expect(bookingServiceMock.bookingById).toHaveBeenCalledWith(123);
    });

    it('should handle service payments with svc_ prefix correctly', async () => {
      const mockQuery = { vnp_TxnRef: 'svc_456' };
      const mockBooking = { bookingId: 456, serviceAmount: 50 };

      jest.spyOn(service['vnpay'], 'verifyReturnUrl').mockReturnValue({
        isVerified: true,
        isSuccess: true,
        vnp_TxnRef: 'svc_456',
      } as any);

      bookingServiceMock.bookingById.mockResolvedValueOnce(mockBooking as any);

      const result = await service.verifyPaymentReturn(mockQuery);
      expect(result).toEqual(mockBooking);
      expect(bookingServiceMock.bookingById).toHaveBeenCalledWith(456);
    });
  });
});
