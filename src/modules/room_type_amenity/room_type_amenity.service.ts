import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { Repository } from 'typeorm';
import { CreateRoomTypeAmenityDto } from './dto/create-room-type-amenity.dto';
import { UpdateRoomTypeAmenityDto } from './dto/update-room-type-amenity.dto';
import { RoomTypeService } from '../room_type/room_type.service';
import { RoomAmenityService } from '../room_amenity/room-amenity.service';

@Injectable()
export class RoomTypeAmenityService {
  constructor(
    @InjectRepository(RoomTypeAmenity)
    private readonly roomTypeAmenityRepository: Repository<RoomTypeAmenity>,
    @Inject(forwardRef(() => RoomTypeService))
    private readonly roomTypeService: RoomTypeService,
    private readonly roomAmenityService: RoomAmenityService,
  ) {}

  async create(createRoomTypeAmenityDto: CreateRoomTypeAmenityDto) {
    const { amenityIds, roomTypeId } = createRoomTypeAmenityDto;

    await this.roomTypeService.roomTypeById(roomTypeId);

    const roomTypeAmenities = await Promise.all(
      amenityIds.map(async (roomAmenityId) => {
        await this.roomAmenityService.amenityById(roomAmenityId);
        return this.roomTypeAmenityRepository.create({
          roomTypeId: roomTypeId,
          roomAmenityId: roomAmenityId,
        });
      }),
    );

    return this.roomTypeAmenityRepository.save(roomTypeAmenities);
  }

  async roomTypeAmenities() {
    const roomTypeAmenities = await this.roomTypeAmenityRepository.find({
      relations: { roomAmenity: true },
    });
    return roomTypeAmenities.map((amenity) => {
      return {
        roomTypeId: amenity.roomTypeId,
        roomAmenityId: amenity.roomAmenityId,
        category: amenity.roomAmenity.category,
        roomAmenityName: amenity.roomAmenity.roomAmenityName,
      };
    });
  }

  async roomTypeAmenityById(roomTypeId: number) {
    const roomTypeAmenities = await this.roomTypeAmenityRepository.find({
      where: { roomTypeId },
      relations: { roomAmenity: true },
    });
    return roomTypeAmenities.map((amenity) => {
      return {
        roomTypeId: amenity.roomTypeId,
        roomAmenityId: amenity.roomAmenityId,
        category: amenity.roomAmenity.category,
        roomAmenityName: amenity.roomAmenity.roomAmenityName,
      };
    });
  }

  async update(
    roomTypeId: number,
    updateRoomTypeAmenityDto: UpdateRoomTypeAmenityDto,
  ) {
    const { amenityIds } = updateRoomTypeAmenityDto;
    await this.roomTypeService.roomTypeById(roomTypeId);

    await this.roomTypeAmenityRepository.delete({ roomTypeId });

    const roomTypeAmenity = await Promise.all(
      amenityIds.map(async (roomAmenityId) => {
        await this.roomAmenityService.amenityById(roomAmenityId);
        return this.roomTypeAmenityRepository.create({
          roomTypeId: roomTypeId,
          roomAmenityId: roomAmenityId,
        });
      }),
    );

    return this.roomTypeAmenityRepository.save(roomTypeAmenity);
  }

  async remove(roomTypeId?: number, roomAmenityId?: number) {
    const where = {
      ...(roomTypeId && { roomTypeId }),
      ...(roomAmenityId && { roomAmenityId }),
    };
    const records = await this.roomTypeAmenityRepository.find({ where });
    if (!records.length) {
      throw new NotFoundException('Tiện ích không tồn tại trên hệ thống.');
    }

    await this.roomTypeAmenityRepository.delete(where);
    return records;
  }
}
