import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomTypeService } from '../room_type/room_type.service';
import { Repository } from 'typeorm';
import { RoomTypeBed } from '../../entities/room-type-bed.entity';
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
  ) {}

  async create(createRoomTypeBedDto: CreateRoomTypeBedDto) {
    const { roomBeds, roomTypeId } = createRoomTypeBedDto;
    await this.roomTypeService.roomTypeById(roomTypeId);

    const roomTypeBeds = await Promise.all(
      roomBeds.map(async (roomBed) => {
        await this.roomBedService.roomBedById(roomBed.roomBedId);
        return this.roomTypeBedRepository.create({
          roomTypeId: roomTypeId,
          roomBedId: roomBed.roomBedId,
          quantity: roomBed.quantity,
        });
      }),
    );

    return this.roomTypeBedRepository.save(roomTypeBeds);
  }

  async roomTypeBeds() {
    return this.roomTypeBedRepository.find();
  }

  async roomTypeBedByRoomTypeId(roomTypeId: number) {
    return this.roomTypeBedRepository.find({
      where: { roomTypeId: roomTypeId },
    });
  }

  async update(roomTypeId: number, updateRoomTypeBed: UpdateRoomTypeBedDto) {
    await this.roomTypeService.roomTypeById(roomTypeId);
    const { roomBeds } = updateRoomTypeBed;
    await this.roomTypeBedRepository.delete({ roomTypeId: roomTypeId });

    const roomTypeBeds = await Promise.all(
      roomBeds.map(async (roomBed) => {
        await this.roomBedService.roomBedById(roomBed.roomBedId);

        return this.roomTypeBedRepository.create({
          roomTypeId: roomTypeId,
          roomBedId: roomBed.roomBedId,
          quantity: roomBed.quantity,
        });
      }),
    );

    return this.roomTypeBedRepository.save(roomTypeBeds);
  }

  async remove(roomTypeId?: number, roomBedId?: number) {
    const where = {
      ...(roomTypeId && { roomTypeId }),
      ...(roomBedId && { roomBedId }),
    };
    console.log(where);
    const records = await this.roomTypeBedRepository.find({ where });
    if (!records.length) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }

    await this.roomTypeBedRepository.delete(where);
    return records;
  }
}
