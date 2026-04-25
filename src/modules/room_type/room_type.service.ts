import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoomType } from '../../entities/room-type.entity';
import { UpdateRoomTypeDto } from './dto/update-roomtype.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';

@Injectable()
export class RoomTypeService {
  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
  ) {}

  async create(createRoomTypeDto: CreateRoomTypeDto) {
    const roomTypeExists = await this.roomTypeRepository.exists({
      where: { typeName: createRoomTypeDto.typeName },
    });

    if (roomTypeExists) {
      throw new ConflictException('Loại phòng này đã tồn tại trong hệ thống.');
    }

    const roomType = this.roomTypeRepository.create(createRoomTypeDto);

    return this.roomTypeRepository.save(roomType);
  }

  async roomTypes() {
    const roomTypes = await this.roomTypeRepository.find({
      relations: {
        roomBeds: true,
        roomImages: true,
        pricePlans: true,
        roomTypeAmenities: { roomAmenity: true },
      },
      order: {
        roomImages: { sortOrder: 'ASC' },
      },
    });

    return roomTypes.map((roomType) => {
      return {
        roomTypeId: roomType.roomTypeId,
        typeName: roomType.typeName,
        description: roomType.description,
        maxOccupancy: roomType.maxOccupancy,
        roomBeds: roomType.roomBeds.map((roomBed) => {
          return {
            roomBedId: roomBed.roomBedId,
            roomBedType: roomBed.roomBedType,
            quantity: roomBed.quantity,
          };
        }),
        roomImages: roomType.roomImages.map((roomImage) => {
          return {
            roomImageId: roomImage.roomImageId,
            url: roomImage.url,
            altText: roomImage.altText,
            sortOrder: roomImage.sortOrder,
            isCover: roomImage.isCover,
          };
        }),
        roomTypeAmenities: roomType.roomTypeAmenities.map((amenity) => {
          return {
            roomAmenityId: amenity.roomAmenityId,
            category: amenity.roomAmenity.category,
            roomAmenityName: amenity.roomAmenity.roomAmenityName,
          };
        }),
        pricePlans: roomType.pricePlans.map((pricePlan) => {
          return {
            pricePlanId: pricePlan.pricePlanId,
            pricePlanName: pricePlan.pricePlanName,
            basePrice: pricePlan.basePrice,
            dateFrom: pricePlan.dateFrom,
            dateTo: pricePlan.dateTo,
            priority: pricePlan.priority,
            isActive: pricePlan.isActive,
          };
        }),
      };
    });
  }

  async roomTypeById(roomTypeId: number) {
    const roomType = await this.roomTypeRepository.findOneBy({ roomTypeId });
    if (!roomType) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }
    return roomType;
  }

  async update(roomTypeId: number, updateRoomTypeDto: UpdateRoomTypeDto) {
    const roomType = await this.roomTypeById(roomTypeId);

    if (
      updateRoomTypeDto.typeName &&
      updateRoomTypeDto.typeName !== roomType.typeName
    ) {
      const exists = await this.roomTypeRepository.exists({
        where: { typeName: updateRoomTypeDto.typeName },
      });
      if (exists) {
        throw new ConflictException(
          'Loại phòng này đã tồn tại trong hệ thống.',
        );
      }
    }

    Object.assign(roomType, updateRoomTypeDto);
    return this.roomTypeRepository.save(roomType);
  }

  async removeById(roomTypeId: number) {
    const roomType = await this.roomTypeRepository.findOne({
      where: { roomTypeId },
      relations: { rooms: true },
    });

    if (!roomType) {
      throw new NotFoundException('Loại phòng không tồn tại.');
    }

    if (roomType.rooms && roomType.rooms.length > 0) {
      throw new ConflictException(
        `Không thể xóa loại phòng đang có ${roomType.rooms.length} phòng liên kết với loại phòng này.`,
      );
    }
    return this.roomTypeRepository.remove(roomType);
  }
}
