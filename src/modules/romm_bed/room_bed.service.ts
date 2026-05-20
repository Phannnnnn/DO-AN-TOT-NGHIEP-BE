import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomBed } from '../../entities/room-bed.entity';
import { Not, Repository } from 'typeorm';
import { CreateRoomBedDto } from './dto/create-room-bed.dto';
import { UpdateRoomBedDto } from './dto/update-room-bed.dto';

@Injectable()
export class RoomBedService {
  constructor(
    @InjectRepository(RoomBed)
    private readonly roomBedRepository: Repository<RoomBed>,
  ) {}

  async create(createRoomBedDto: CreateRoomBedDto): Promise<RoomBed> {
    const roomBedExists = await this.roomBedRepository.findOne({
      where: {
        roomBedType: createRoomBedDto.roomBedType,
      },
    });

    if (roomBedExists) {
      throw new ConflictException('Giường này đã tồn tại trên hệ thống.');
    }

    const roomBed = this.roomBedRepository.create(createRoomBedDto);
    return this.roomBedRepository.save(roomBed);
  }

  async roomBeds() {
    return this.roomBedRepository.find({});
  }

  async roomBedById(roomBedId: number) {
    const roomBed = await this.roomBedRepository.findOne({
      where: { roomBedId },
    });
    if (!roomBed) {
      throw new NotFoundException('Loại giường không tồn tại trên hệ thống.');
    }
    return roomBed;
  }

  async update(roomBedId: number, updateRoomBedDto: UpdateRoomBedDto) {
    const roomBed = await this.roomBedById(roomBedId);
    Object.assign(roomBed, updateRoomBedDto);
    return this.roomBedRepository.save(roomBed);
  }

  async remove(roomBedId: number) {
    const roomBed = await this.roomBedById(roomBedId);
    if (!roomBed) {
      throw new NotFoundException('Giường không tồn tại trên hệ thống.');
    }
    await this.roomBedRepository.delete(roomBedId);
    return roomBed;
  }
}
