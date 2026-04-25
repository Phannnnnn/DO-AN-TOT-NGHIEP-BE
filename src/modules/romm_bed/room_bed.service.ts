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
import { RoomTypeService } from '../room_type/room_type.service';

@Injectable()
export class RoomBedService {
  constructor(
    @InjectRepository(RoomBed)
    private readonly roomBedRepository: Repository<RoomBed>,
    private readonly roomTypeService: RoomTypeService,
  ) {}

  async create(createRoomBedDto: CreateRoomBedDto): Promise<RoomBed> {
    await this.roomTypeService.roomTypeById(createRoomBedDto.roomTypeId);

    const roomBedExists = await this.roomBedRepository.findOne({
      where: {
        roomTypeId: createRoomBedDto.roomTypeId,
        roomBedType: createRoomBedDto.roomBedType,
      },
    });

    if (roomBedExists) {
      throw new ConflictException('Giường này đã tồn tại trên hệ thống.');
    }

    const roomBed = this.roomBedRepository.create(createRoomBedDto);
    return this.roomBedRepository.save(roomBed);
  }

  async roomBeds(roomTypeId: number): Promise<RoomBed[]> {
    return this.roomBedRepository.find({
      where: { roomTypeId },
    });
  }

  async roomBedById(roomBedId: number) {
    const roomBed = await this.roomBedRepository.findOne({
      where: { roomBedId },
    });
    if (!roomBed) {
      throw new NotFoundException('Giường không tồn tại trên hệ thống.');
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
    return this.roomBedRepository.remove(roomBed);
  }
}
