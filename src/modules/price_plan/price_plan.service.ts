import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PricePlan } from '../../entities/price-plan.entity';
import { Repository } from 'typeorm';
import { CreatePricePlanDto } from './dto/create-price-plan.dto';
import { UpdatePricePlanDto } from './dto/update-price-plan.dto';
import { RoomTypeService } from '../room_type/room_type.service';

@Injectable()
export class PricePlanService {
  constructor(
    @InjectRepository(PricePlan)
    private readonly pricePlanRepository: Repository<PricePlan>,
    private readonly roomTypeService: RoomTypeService,
  ) {}

  async create(createPricePlanDto: CreatePricePlanDto): Promise<PricePlan> {
    await this.roomTypeService.roomTypeById(createPricePlanDto.roomTypeId);

    const planExists = await this.pricePlanRepository.findOne({
      where: {
        roomTypeId: createPricePlanDto.roomTypeId,
        pricePlanName: createPricePlanDto.pricePlanName,
      },
    });

    if (planExists) {
      throw new ConflictException(
        'Kế hoạch giá này đã tồn tại trong loại phòng.',
      );
    }

    const pricePlan = this.pricePlanRepository.create(createPricePlanDto);
    return this.pricePlanRepository.save(pricePlan);
  }

  async pricePlans(roomTypeId: number): Promise<PricePlan[]> {
    await this.roomTypeService.roomTypeById(roomTypeId);
    return this.pricePlanRepository.find({
      where: { roomTypeId },
      order: { priority: 'DESC' },
    });
  }

  async pricePlanById(pricePlanId: number): Promise<PricePlan> {
    const pricePlan = await this.pricePlanRepository.findOne({
      where: { pricePlanId },
    });
    if (!pricePlan) {
      throw new NotFoundException('Kế hoạch giá không tồn tại trên hệ thống.');
    }
    return pricePlan;
  }

  async update(
    pricePlanId: number,
    updatePricePlanDto: UpdatePricePlanDto,
  ): Promise<PricePlan> {
    const pricePlan = await this.pricePlanById(pricePlanId);

    // Kiểm tra tên mới có trùng với plan khác trong cùng loại phòng không
    if (
      updatePricePlanDto.pricePlanName &&
      updatePricePlanDto.pricePlanName !== pricePlan.pricePlanName
    ) {
      const planExists = await this.pricePlanRepository.findOne({
        where: {
          roomTypeId: pricePlan.roomTypeId,
          pricePlanName: updatePricePlanDto.pricePlanName,
        },
      });

      if (planExists) {
        throw new ConflictException(
          'Kế hoạch giá này đã tồn tại trong loại phòng.',
        );
      }
    }

    Object.assign(pricePlan, updatePricePlanDto);
    return this.pricePlanRepository.save(pricePlan);
  }

  async remove(pricePlanId: number): Promise<PricePlan> {
    const pricePlan = await this.pricePlanById(pricePlanId);
    return this.pricePlanRepository.remove(pricePlan);
  }
}
