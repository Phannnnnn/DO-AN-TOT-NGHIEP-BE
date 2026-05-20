import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomAmenity } from '../../entities/room-amenity.entity';
import { CreateRoomAmenityDto } from './dto/create-room-amenity.dto';
import { UpdateRoomAmenityDto } from './dto/update-room-amenity.dto';

@Injectable()
export class RoomAmenityService {
  constructor(
    @InjectRepository(RoomAmenity)
    private readonly roomAmenityRepository: Repository<RoomAmenity>,
  ) {}

  async create(createAmenityDto: CreateRoomAmenityDto) {
    const emenityExists = await this.roomAmenityRepository.exists({
      where: { roomAmenityName: createAmenityDto.roomAmenityName },
    });

    if (emenityExists) {
      throw new ConflictException('Tiện ích đã tồn tại trong hệ thống.');
    }

    const amenity = this.roomAmenityRepository.create(createAmenityDto);
    return this.roomAmenityRepository.save(amenity);
  }

  amenities() {
    return this.roomAmenityRepository.find({});
  }

  async amenityById(roomAmenityId: number) {
    const amenity = await this.roomAmenityRepository.findOneBy({
      roomAmenityId,
    });
    if (!amenity) {
      throw new NotFoundException('Tiện ích không tồn tại trên hệ thống.');
    }
    return amenity;
  }

  async update(
    roomAmenityId: number,
    updateRoomAmenityDto: UpdateRoomAmenityDto,
  ) {
    const amenity = await this.roomAmenityRepository.existsBy({
      roomAmenityId,
    });
    if (!amenity) {
      throw new NotFoundException('Tiện ích không tồn tại trong hệ thống.');
    }

    await this.roomAmenityRepository.update(
      roomAmenityId,
      updateRoomAmenityDto,
    );

    return this.roomAmenityRepository.findOneBy({ roomAmenityId });
  }

  async remove(roomAmenityId: number) {
    const amenity = await this.roomAmenityRepository.findOne({
      where: { roomAmenityId },
    });

    if (!amenity) {
      throw new NotFoundException('Tiện ích không tồn tại trong hệ thống.');
    }

    

    await this.roomAmenityRepository.delete(roomAmenityId);
    return amenity;
  }
}
