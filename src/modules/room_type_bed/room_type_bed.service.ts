import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomTypeService } from '../room_type/room_type.service';
import { Repository } from 'typeorm';
import { RoomTypeBed } from '../../entities/room-type-bed.entity';
import { RoomType } from '../../entities/room-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoomTypeBedDto } from './dto/create-room-type-bed.dto';
import { UpdateRoomTypeBedDto } from './dto/update-room-type-bed.dto';
import { RoomBedService } from '../romm_bed/room_bed.service';
@Injectable()
export class RoomTypeBedService {
  constructor(
    @Inject(forwardRef(() => RoomTypeService))
    private readonly roomTypeService: RoomTypeService,
    private readonly roomBedService: RoomBedService,
    @InjectRepository(RoomTypeBed)
    private readonly roomTypeBedRepository: Repository<RoomTypeBed>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
  ) {}
  private async recalculateOccupancy(roomTypeId: number): Promise<void> {
    const beds = await this.roomTypeBedRepository.find({
      where: { roomTypeId },
      relations: { roomBed: true },
    });
    const maxOccupancy = beds.reduce(
      (sum, b) => sum + b.roomBed.capacity * b.quantity,
      0,
    );
    await this.roomTypeRepository.update(roomTypeId, {
      maxOccupancy: maxOccupancy || 1,
    });
  }
  async create(createRoomTypeBedDto: CreateRoomTypeBedDto) {
    const { roomBeds, roomTypeId } = createRoomTypeBedDto;
    await this.roomTypeService.roomTypeById(roomTypeId);
    const roomTypeBeds = await Promise.all(
      roomBeds.map(async (roomBed) => {
        await this.roomBedService.roomBedById(roomBed.roomBedId);
        return this.roomTypeBedRepository.create({
          roomTypeId,
          roomBedId: roomBed.roomBedId,
          quantity: roomBed.quantity,
        });
      }),
    );
    const saved = await this.roomTypeBedRepository.save(roomTypeBeds);
    await this.recalculateOccupancy(roomTypeId);
    return saved;
  }
  async roomTypeBeds() {
    return this.roomTypeBedRepository.find();
  }
  async roomTypeBedByRoomTypeId(roomTypeId: number) {
    return this.roomTypeBedRepository.find({
      where: { roomTypeId },
    });
  }
  async update(roomTypeId: number, updateRoomTypeBed: UpdateRoomTypeBedDto) {
    await this.roomTypeService.roomTypeById(roomTypeId);
    const { roomBeds } = updateRoomTypeBed;
    await this.roomTypeBedRepository.delete({ roomTypeId });
    const roomTypeBeds = await Promise.all(
      roomBeds.map(async (roomBed) => {
        await this.roomBedService.roomBedById(roomBed.roomBedId);
        return this.roomTypeBedRepository.create({
          roomTypeId,
          roomBedId: roomBed.roomBedId,
          quantity: roomBed.quantity,
        });
      }),
    );
    const saved = await this.roomTypeBedRepository.save(roomTypeBeds);
    await this.recalculateOccupancy(roomTypeId);
    return saved;
  }
  async remove(roomTypeId?: number, roomBedId?: number) {
    const where = {
      ...(roomTypeId && { roomTypeId }),
      ...(roomBedId && { roomBedId }),
    };
    const records = await this.roomTypeBedRepository.find({ where });
    if (!records.length) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }
    await this.roomTypeBedRepository.delete(where);
    if (roomTypeId) {
      await this.recalculateOccupancy(roomTypeId);
    }
    return records;
  }
}
