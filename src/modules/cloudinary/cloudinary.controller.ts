import { Controller, Post, Body } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('sign')
  sign(@Body('folder') folder: string) {
    return this.cloudinaryService.generateSignature(folder);
  }
}
