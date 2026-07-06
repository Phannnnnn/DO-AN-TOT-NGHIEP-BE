import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async test(@Body() body: { email: string }) {
    await this.mailService.sendTestMail(body.email);
    return { message: 'Sent' };
  }
}
