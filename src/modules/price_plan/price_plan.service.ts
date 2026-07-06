import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PricePlan } from '../../entities/price-plan.entity';
import { LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreatePricePlanDto } from './dto/create-price-plan.dto';
import { UpdatePricePlanDto } from './dto/update-price-plan.dto';
import { RoomTypeService } from '../room_type/room_type.service';
import { PricePlanType } from '../../common/enums/price-plan-type.enum';
import { PricePlanScheduler } from './price_plan.scheduler';

@Injectable()
export class PricePlanService {
  constructor(
    @InjectRepository(PricePlan)
    private readonly pricePlanRepository: Repository<PricePlan>,

    @Inject(forwardRef(() => RoomTypeService))
    private readonly roomTypeService: RoomTypeService,
    private readonly pricePlanScheduler: PricePlanScheduler,
  ) {}

  async create(createPricePlanDto: CreatePricePlanDto): Promise<PricePlan> {
    await this.roomTypeService.roomTypeById(createPricePlanDto.roomTypeId);

    if (
      createPricePlanDto.type === PricePlanType.WEEKDAY ||
      createPricePlanDto.type === PricePlanType.WEEKEND
    ) {
      const typeExists = await this.pricePlanRepository.findOne({
        where: {
          roomTypeId: createPricePlanDto.roomTypeId,
          type: createPricePlanDto.type,
        },
      });
      if (typeExists) {
        throw new ConflictException(
          `Loại phòng này đã có giá ${createPricePlanDto.type === PricePlanType.WEEKDAY ? 'ngày thường' : 'cuối tuần'}.`,
        );
      }
    }

    if (createPricePlanDto.type === PricePlanType.HOLIDAY) {
      const nameExists = await this.pricePlanRepository.findOne({
        where: {
          roomTypeId: createPricePlanDto.roomTypeId,
          pricePlanName: createPricePlanDto.pricePlanName,
        },
      });
      if (nameExists) {
        throw new ConflictException(
          `Tên kế hoạch '${createPricePlanDto.pricePlanName}' đã được sử dụng với loại phòng này.`,
        );
      }

      const { dateFrom, dateTo } = createPricePlanDto;
      if (!dateFrom || !dateTo) {
        throw new BadRequestException(
          'Kế hoạch giá ngày lễ phải có ngày bắt đầu và ngày kết thúc.',
        );
      }

      this.validateHolidayDates(dateFrom, dateTo);
      await this.checkHolidayOverlap(
        createPricePlanDto.roomTypeId,
        dateFrom,
        dateTo,
      );
    }

    if (createPricePlanDto.type !== PricePlanType.HOLIDAY) {
      createPricePlanDto.dateFrom = undefined;
      createPricePlanDto.dateTo = undefined;
    }

    const pricePlan = this.pricePlanRepository.create(createPricePlanDto);
    await this.pricePlanRepository.save(pricePlan);
    await this.pricePlanScheduler.syncActivePlans();
    return this.pricePlanById(pricePlan.pricePlanId);
  }

  async pricePlans(roomTypeId: number): Promise<PricePlan[]> {
    await this.roomTypeService.roomTypeById(roomTypeId);
    return this.pricePlanRepository.find({ where: { roomTypeId } });
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

    const pricePlanExists = await this.pricePlanRepository.exists({
      where: {
        roomTypeId: pricePlan.roomTypeId,
        pricePlanName: updatePricePlanDto.pricePlanName,
        pricePlanId: Not(pricePlan.pricePlanId),
      },
    });

    if (pricePlanExists) {
      throw new ConflictException(
        'Tên kế hoạch này đã được sử dụng với loại phòng này.',
      );
    }

    if (updatePricePlanDto.type && updatePricePlanDto.type !== pricePlan.type) {
      throw new BadRequestException(
        'Không thể thay đổi loại kế hoạch sau khi tạo.',
      );
    }

    if (pricePlan.type === PricePlanType.HOLIDAY) {
      if (
        updatePricePlanDto.pricePlanName &&
        updatePricePlanDto.pricePlanName !== pricePlan.pricePlanName
      ) {
        const nameExists = await this.pricePlanRepository.findOne({
          where: {
            roomTypeId: pricePlan.roomTypeId,
            pricePlanName: updatePricePlanDto.pricePlanName,
          },
        });
        if (nameExists) {
          throw new ConflictException('Kế hoạch giá ngày lễ này đã tồn tại.');
        }
      }

      const finalDateFrom = updatePricePlanDto.dateFrom ?? pricePlan.dateFrom;
      const finalDateTo = updatePricePlanDto.dateTo ?? pricePlan.dateTo;

      if (!finalDateFrom || !finalDateTo) {
        throw new BadRequestException(
          'Kế hoạch ngày lễ phải có đầy đủ ngày bắt đầu và kết thúc.',
        );
      }

      this.validateHolidayDates(finalDateFrom, finalDateTo);
      await this.checkHolidayOverlap(
        pricePlan.roomTypeId,
        finalDateFrom,
        finalDateTo,
        pricePlanId,
      );
    } else {
      updatePricePlanDto.dateFrom = undefined;
      updatePricePlanDto.dateTo = undefined;
    }

    Object.assign(pricePlan, updatePricePlanDto);

    const updatedPlan = await this.pricePlanRepository.save(pricePlan);

    await this.pricePlanScheduler.syncActivePlans();

    return updatedPlan;
  }

  async remove(pricePlanId: number): Promise<PricePlan> {
    const pricePlan = await this.pricePlanById(pricePlanId);
    const removed = await this.pricePlanRepository.remove(pricePlan);
    await this.pricePlanScheduler.syncActivePlans();
    return removed;
  }

  private parseAndValidateDate(dateStr: string, fieldName: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException(`${fieldName} không hợp lệ.`);
    }
    return date;
  }

  private validateHolidayDates(dateFrom: string, dateTo: string): void {
    const from = this.parseAndValidateDate(dateFrom, 'Ngày bắt đầu');
    const to = this.parseAndValidateDate(dateTo, 'Ngày kết thúc');

    if (from >= to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc.');
    }
  }

  private async checkHolidayOverlap(
    roomTypeId: number,
    dateFrom: string,
    dateTo: string,
    excludePricePlanId?: number,
  ): Promise<void> {
    const overlap = await this.pricePlanRepository.findOne({
      where: {
        roomTypeId: roomTypeId,
        type: PricePlanType.HOLIDAY,
        dateFrom: LessThanOrEqual(dateTo),
        dateTo: MoreThanOrEqual(dateFrom),
        ...(excludePricePlanId && { pricePlanId: Not(excludePricePlanId) }),
      },
    });

    if (overlap) {
      throw new ConflictException(
        `Khoảng ngày bị trùng với kế hoạch giá "${overlap.pricePlanName}" (${overlap.dateFrom} → ${overlap.dateTo}).`,
      );
    }
  }
}
