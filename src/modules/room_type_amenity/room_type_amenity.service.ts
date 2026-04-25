import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { Repository } from 'typeorm';
import { CreateRoomTypeAmenityDto } from './dto/create-room-type-amenity.dto';
import { UpdateRoomTypeAmenityDto } from './dto/update-room-type-amenity.dto';

@Injectable()
export class RoomTypeAmenityService {
  constructor(
    @InjectRepository(RoomTypeAmenity)
    private readonly roomTypeAmenityRepository: Repository<RoomTypeAmenity>,
  ) {}

  async create(createRoomTypeAmenityDto: CreateRoomTypeAmenityDto) {
    const { amenityIds, roomTypeId } = createRoomTypeAmenityDto;

    const roomTypeExists = await this.roomTypeAmenityRepository.existsBy({
      roomTypeId,
    });

    if (!roomTypeExists) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }

    const roomTypeAmenity = amenityIds.map((roomAmenityId) =>
      this.roomTypeAmenityRepository.create({
        roomTypeId: roomTypeId,
        roomAmenityId: roomAmenityId,
      }),
    );

    return this.roomTypeAmenityRepository.save(roomTypeAmenity);
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
    const roomTypeExists = await this.roomTypeAmenityRepository.existsBy({
      roomTypeId,
    });

    if (!roomTypeExists) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }

    await this.roomTypeAmenityRepository.delete({ roomTypeId });

    const roomTypeAmenity = amenityIds.map((roomAmenityId) =>
      this.roomTypeAmenityRepository.create({
        roomTypeId: roomTypeId,
        roomAmenityId: roomAmenityId,
      }),
    );

    return this.roomTypeAmenityRepository.save(roomTypeAmenity);
  }

  async remove(roomTypeId?: number, roomAmenityId?: number) {
    const where = {
      ...(roomTypeId && { roomTypeId }),
      ...(roomAmenityId && { roomAmenityId }),
    };

    console.log(roomTypeId, '-', roomAmenityId);

    const records = await this.roomTypeAmenityRepository.find({ where });

    if (!records.length) {
      throw new NotFoundException('');
    }

    await this.roomTypeAmenityRepository.delete(where);
    return records;
  }
}
