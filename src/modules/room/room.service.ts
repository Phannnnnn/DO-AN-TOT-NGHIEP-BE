import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from '../../entities/room.entity';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomTypeService } from '../room_type/room_type.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly roomTypeService: RoomTypeService,
  ) {}

  handleReturnData(room: any) {
    if (!room) {
      return;
    }

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
      roomBeds: room.roomType.roomBeds.map((roomBeds) => {
        return {
          roomBedId: roomBeds.roomBedId,
          roomBedType: roomBeds.roomBedType,
          quantity: roomBeds.quantity,
        };
      }),
      roomImages: room.roomType.roomImages.map((images) => {
        return {
          roomImageId: images.roomImageId,
          url: images.url,
          altText: images.altText,
          sortOrder: images.sortOrder,
          isCover: images.isCover,
        };
      }),
      roomTypeAmenities: room.roomType.roomTypeAmenities.map((amenity) => {
        return {
          roomAmenityId: amenity.roomAmenityId,
          category: amenity.roomAmenity.category,
          roomAmenityName: amenity.roomAmenity.roomAmenityName,
        };
      }),
      pricePlans: room.roomType.pricePlans
        .filter((p) => p.isActive)
        .sort((a, b) => b.priority - a.priority)[0],
    };
  }

  async create(createRoomDto: CreateRoomDto) {
    // Kiểm tra loại phòng tồn tại không
    await this.roomTypeService.roomTypeById(createRoomDto.roomTypeId);

    // Kiểm tra số phòng đã tồn tại chưa (số phòng phải unique toàn khách sạn)
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

    const rooms = await this.roomRepository.findOne({
      where: { roomId: room.roomId },
      relations: {
        roomType: {
          roomBeds: true,
          roomImages: true,
          pricePlans: true,
          roomTypeAmenities: { roomAmenity: true },
        },
      },
      order: {
        roomNumber: 'ASC',
        roomType: {
          roomImages: {
            sortOrder: 'ASC',
          },
        },
      },
    });

    return this.handleReturnData(rooms);
  }

  async rooms(roomTypeId?: number) {
    // Nếu có roomTypeId thì kiểm tra loại phòng tồn tại không
    if (roomTypeId) {
      await this.roomTypeService.roomTypeById(roomTypeId);
    }

    const rooms = await this.roomRepository.find({
      where: roomTypeId ? { roomTypeId } : {},
      relations: {
        roomType: {
          roomBeds: true,
          roomImages: true,
          pricePlans: true,
          roomTypeAmenities: { roomAmenity: true },
        },
      },
      order: {
        roomNumber: 'ASC',
        roomType: {
          roomImages: {
            sortOrder: 'ASC',
          },
        },
      },
    });

    return rooms.map((room) => {
      return this.handleReturnData(room);
    });
  }

  async roomById(roomId: number) {
    const room = await this.roomRepository.findOne({
      where: { roomId },
      relations: {
        roomType: {
          roomBeds: true,
          roomImages: true,
          pricePlans: true,
          roomTypeAmenities: { roomAmenity: true },
        },
      },
      order: {
        roomNumber: 'ASC',
        roomType: {
          roomImages: {
            sortOrder: 'ASC',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trên hệ thống.');
    }

    return this.handleReturnData(room);
  }

  async update(roomId: number, updateRoomDto: UpdateRoomDto) {
    const room = await this.roomRepository.findOneBy({ roomId: roomId });

    if (!room) {
      throw new NotFoundException(`Phòng này không tồn tại trên hệ thống.`);
    }

    // Nếu đổi số phòng thì kiểm tra trùng không
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
      await this.roomTypeService.roomTypeById(updateRoomDto.roomTypeId);
    }

    Object.assign(room, updateRoomDto);
    await this.roomRepository.save(room);

    return this.roomById(roomId);
  }

  async remove(roomId: number) {
    const room = await this.roomRepository.findOneBy({ roomId: roomId });

    if (!room) {
      throw new NotFoundException(`Phòng này không tồn tại trên hệ thống.`);
    }
    const roomRemoved = this.roomById(roomId);
    await this.roomRepository.remove(room);
    return roomRemoved;
  }
}
