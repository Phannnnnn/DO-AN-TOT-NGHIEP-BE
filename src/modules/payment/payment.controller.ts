import { Controller, Post, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly vnpayService: PaymentService) {}

  @Post('create-payment/:bookingId')
  createPayment(@Param('bookingId') bookingId: string, @Req() req: Request) {
    const ipAddr = req.ip || '127.0.0.1';
    return this.vnpayService.createPaymentUrl(+bookingId, ipAddr);
  }

  @Get('ipn')
  handleIpn(@Query() query: Record<string, string>) {
    return this.vnpayService.handleIpn(query);
  }

  @Post('pay-cash/:bookingId')
  payCash(@Param('bookingId') bookingId: number) {
    return this.vnpayService.payCash(bookingId);
  }
}
