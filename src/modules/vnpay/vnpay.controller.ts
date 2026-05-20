import { Controller, Post, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { VnpayService } from './vnpay.service';

@Controller('payment')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

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
  payCash(@Param('bookingId') bookingId: string) {
    return this.vnpayService.payCash(+bookingId);
  }
}
