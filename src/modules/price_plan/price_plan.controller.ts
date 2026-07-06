import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PricePlanService } from './price_plan.service';
import { CreatePricePlanDto } from './dto/create-price-plan.dto';
import { UpdatePricePlanDto } from './dto/update-price-plan.dto';

@Controller('price-plan')
export class PricePlanController {
  constructor(private readonly pricePlanService: PricePlanService) {}

  @Post()
  async create(@Body() createPricePlanDto: CreatePricePlanDto) {
    return this.pricePlanService.create(createPricePlanDto);
  }

  @Get('room-type/:roomTypeId')
  async pricePlans(@Param('roomTypeId', ParseIntPipe) roomTypeId: number) {
    return this.pricePlanService.pricePlans(roomTypeId);
  }

  @Get(':id')
  async pricePlanById(@Param('id', ParseIntPipe) pricePlanId: number) {
    return this.pricePlanService.pricePlanById(pricePlanId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) pricePlanId: number,
    @Body() updatePricePlanDto: UpdatePricePlanDto,
  ) {
    return this.pricePlanService.update(pricePlanId, updatePricePlanDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) pricePlanId: number) {
    return this.pricePlanService.remove(pricePlanId);
  }
}
