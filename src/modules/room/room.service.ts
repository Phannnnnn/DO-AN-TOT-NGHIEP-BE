import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from '../../entities/room.entity';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomTypeService } from '../room_type/room_type.service';
import { UpdateStatusRoomDto } from './dto/update-status-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly roomTypeService: RoomTypeService,
  ) {}

  private formatRoom(room: Room) {
    const activePlan = room.roomType.pricePlans.find((p) => p.isActive) ?? null;

    // return room;
    return {
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
      roomType: {
        roomTypeId: room.roomType.roomTypeId,
        typeName: room.roomType.typeName,
        description: room.roomType.description,
        maxOccupancy: room.roomType.maxOccupancy,
      },
      pricePlan: activePlan
        ? {
            pricePlanId: activePlan.pricePlanId,
            pricePlanName: activePlan.pricePlanName,
            type: activePlan.type,
            basePrice: activePlan.basePrice,
          }
        : null,
      roomBeds: room.roomType.roomTypeBed.map((bed) => {
        return {
          roomBedId: bed.roomBedId,
          roomBedType: bed.roomBed.roomBedType,
          quantity: bed.quantity,
          capacity: bed.roomBed.capacity,
        };
      }),
      roomImages: room.roomType.roomImages.map((img) => ({
        roomImageId: img.roomImageId,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isCover: img.isCover,
      })),
      roomTypeAmenities: room.roomType.roomTypeAmenities.map((amenity) => ({
        roomAmenityId: amenity.roomAmenityId,
        category: amenity.roomAmenity.category,
        roomAmenityName: amenity.roomAmenity.roomAmenityName,
      })),
    };
  }

  private async roomByIdEntity(roomId: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomId },
      relations: {
        roomType: {
          roomTypeBed: { roomBed: true },
          roomImages: true,
          pricePlans: true,
          roomTypeAmenities: { roomAmenity: true },
        },
      },
      order: {
        roomType: { roomImages: { sortOrder: 'ASC' } },
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trên hệ thống.');
    }

    return room;
  }

  async create(createRoomDto: CreateRoomDto) {
    await this.roomTypeService.roomTypeByIdEntity(createRoomDto.roomTypeId);

    const roomExists = await this.roomRepository.findOne({
      where: { roomNumber: createRoomDto.roomNumber },
    });
    if (roomExists) {
      throw new ConflictException(
        `Phòng số ${createRoomDto.roomNumber} đã tồn tại trên hệ thống.`,
      );
    }

    const room = this.roomRepository.create(createRoomDto);
    await this.roomRepository.save(room);
    return this.formatRoom(await this.roomByIdEntity(room.roomId));
  }

  async rooms() {
    const rooms = await this.roomRepository.find({
      relations: {
        roomType: {
          roomTypeBed: { roomBed: true },
          roomImages: true,
          pricePlans: true,
          roomTypeAmenities: { roomAmenity: true },
        },
      },
      order: {
        roomNumber: 'ASC',
        roomType: { roomImages: { sortOrder: 'ASC' } },
      },
    });
    return rooms.map((room) => this.formatRoom(room));
  }

  async roomById(roomId: number) {
    return this.formatRoom(await this.roomByIdEntity(roomId));
  }

  async update(roomId: number, updateRoomDto: UpdateRoomDto) {
    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room) {
      throw new NotFoundException('Phòng này không tồn tại trên hệ thống.');
    }

    if (
      updateRoomDto.roomNumber &&
      updateRoomDto.roomNumber !== room.roomNumber
    ) {
      const roomExists = await this.roomRepository.findOne({
        where: { roomNumber: updateRoomDto.roomNumber },
      });
      if (roomExists) {
        throw new ConflictException(
          `Phòng số ${updateRoomDto.roomNumber} đã tồn tại trên hệ thống.`,
        );
      }
    }

    if (
      updateRoomDto.roomTypeId &&
      updateRoomDto.roomTypeId !== room.roomTypeId
    ) {
      await this.roomTypeService.roomTypeByIdEntity(updateRoomDto.roomTypeId);
    }

    Object.assign(room, updateRoomDto);
    await this.roomRepository.save(room);
    return this.roomById(roomId);
  }

  async updateStatus(roomId: number, updateStatusRoom: UpdateStatusRoomDto) {
    const room = await this.roomById(roomId);
    if (updateStatusRoom.status) {
      if (!room) {
        throw new NotFoundException('Phòng không tồn tại trên hệ thống.');
      }
      room.status = updateStatusRoom.status;
    }

    return room;
  }

  async remove(roomId: number) {
    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room) {
      throw new NotFoundException('Phòng này không tồn tại trên hệ thống.');
    }
    const data = await this.roomById(roomId);
    await this.roomRepository.remove(room);
    return data;
  }
}
