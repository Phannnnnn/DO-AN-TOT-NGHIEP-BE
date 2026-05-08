import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType } from '../../entities/room-type.entity';
import { UpdateRoomTypeDto } from './dto/update-roomtype.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { RoomTypeAmenity } from '../../entities/room-type-amenity.entity';
import { RoomTypeAmenityService } from '../room_type_amenity/room_type_amenity.service';
import { RoomTypeBedService } from '../room_type_bed/room_type_bed.service';
import { PricePlanService } from '../price_plan/price_plan.service';

@Injectable()
export class RoomTypeService {
  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,

    @Inject(forwardRef(() => RoomTypeAmenityService))
    private roomTypeAmenityService: RoomTypeAmenityService,

    @Inject(forwardRef(() => RoomTypeBedService))
    private readonly roomTypeBedService: RoomTypeBedService,

    @Inject(forwardRef(() => PricePlanService))
    private readonly pricePlanService: PricePlanService,
  ) {}

  async create(createRoomTypeDto: CreateRoomTypeDto) {
    const roomTypeExists = await this.roomTypeRepository.exists({
      where: { typeName: createRoomTypeDto.typeName },
    });

    if (roomTypeExists) {
      throw new ConflictException('Loại phòng này đã tồn tại trong hệ thống.');
    }

    const roomTypeCreateData = {
      typeName: createRoomTypeDto.typeName,
      description: createRoomTypeDto.description,
      maxOccupancy: createRoomTypeDto.maxOccupancy,
    };

    const roomType = this.roomTypeRepository.create(roomTypeCreateData);
    await this.roomTypeRepository.save(roomType);

    const roomTypeId = roomType.roomTypeId;

    const { amenityIds, roomBeds, images, pricePlans } = createRoomTypeDto;

    if (amenityIds?.length) {
      await this.roomTypeAmenityService.create({
        roomTypeId: roomTypeId,
        amenityIds: amenityIds ?? [],
      });
    }

    if (roomBeds?.length) {
      await this.roomTypeBedService.create({
        roomTypeId: roomTypeId,
        roomBeds: roomBeds ?? [],
      });
    }

    if (pricePlans?.length) {
      await Promise.all(
        pricePlans.map(async (pricePlan) => {
          await this.pricePlanService.create({
            roomTypeId: roomTypeId,
            pricePlanName: pricePlan.pricePlanName,
            type: pricePlan.type,
            basePrice: pricePlan.basePrice,
            dateFrom: pricePlan?.dateFrom,
            dateTo: pricePlan?.dateTo,
          });
        }),
      );
    }

    if (images?.length) {
    }

    return this.formatRoomType(await this.roomTypeByIdEntity(roomTypeId));
  }

  async roomTypes() {
    const roomTypes = await this.roomTypeRepository.find({
      relations: {
        roomTypeBed: { roomBed: true },
        roomImages: true,
        pricePlans: true,
        roomTypeAmenities: { roomAmenity: true },
      },
      order: { roomImages: { sortOrder: 'ASC' } },
    });

    return roomTypes.map((roomType) => this.formatRoomType(roomType));
  }

  async roomTypeByIdEntity(roomTypeId: number): Promise<RoomType> {
    const roomType = await this.roomTypeRepository.findOne({
      where: { roomTypeId },
      relations: {
        roomTypeBed: { roomBed: true },
        roomImages: true,
        pricePlans: true,
        roomTypeAmenities: { roomAmenity: true },
      },
      order: { roomImages: { sortOrder: 'ASC' } },
    });
    if (!roomType) {
      throw new NotFoundException('Loại phòng không tồn tại trên hệ thống.');
    }
    return roomType;
  }

  async roomTypeById(roomTypeId: number) {
    const roomType = await this.roomTypeByIdEntity(roomTypeId);
    return this.formatRoomType(roomType);
  }

  async update(roomTypeId: number, updateRoomTypeDto: UpdateRoomTypeDto) {
    const roomType = await this.roomTypeByIdEntity(roomTypeId);

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

    const {
      typeName,
      description,
      maxOccupancy,
      amenityIds,
      roomBeds,
      pricePlans,
      images,
    } = updateRoomTypeDto;

    // 1. Update fields cơ bản
    Object.assign(roomType, { typeName, description, maxOccupancy });
    await this.roomTypeRepository.save(roomType);

    // 2. Update tiện ích
    if (amenityIds !== undefined) {
      await this.roomTypeAmenityService.update(roomTypeId, { amenityIds });
    }

    // 3. Update giường
    if (roomBeds !== undefined) {
      await this.roomTypeBedService.update(roomTypeId, { roomBeds });
    }

    // 4. Update pricePlans
    if (pricePlans !== undefined) {
      await Promise.all(
        pricePlans.map(async (pricePlan) => {
          if (pricePlan.pricePlanId) {
            return this.pricePlanService.update(pricePlan.pricePlanId, {
              pricePlanName: pricePlan.pricePlanName,
              basePrice: pricePlan.basePrice,
              dateFrom: pricePlan?.dateFrom,
              dateTo: pricePlan?.dateTo,
            });
          } else {
            return this.pricePlanService.create({
              roomTypeId: roomTypeId,
              pricePlanName: pricePlan.pricePlanName,
              type: pricePlan.type,
              basePrice: pricePlan.basePrice,
              dateFrom: pricePlan?.dateFrom,
              dateTo: pricePlan?.dateTo,
            });
          }
        }),
      );
    }

    if (images !== undefined) {
    }
    return this.formatRoomType(await this.roomTypeByIdEntity(roomTypeId));
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

    await this.roomTypeRepository.delete({ roomTypeId });
    return roomType;
  }

  private formatRoomType(roomType: RoomType) {
    return {
      roomTypeId: roomType.roomTypeId,
      typeName: roomType.typeName,
      description: roomType.description,
      maxOccupancy: roomType.maxOccupancy,
      pricePlan: roomType.pricePlans.map((price) => {
        return {
          pricePlanId: price.pricePlanId,
          pricePlanName: price.pricePlanName,
          type: price.type,
          basePrice: price.basePrice,
          dateFrom: price?.dateFrom,
          dateTo: price?.dateTo,
        };
      }),
      roomBeds: roomType.roomTypeBed.map((bed) => ({
        roomBedId: bed.roomBedId,
        roomBedType: bed.roomBed.roomBedType,
        quantity: bed.quantity,
      })),
      roomImages: roomType.roomImages.map((img) => ({
        roomImageId: img.roomImageId,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isCover: img.isCover,
      })),
      roomTypeAmenities: roomType.roomTypeAmenities.map((a) => ({
        roomAmenityId: a.roomAmenityId,
        category: a.roomAmenity.category,
        roomAmenityName: a.roomAmenity.roomAmenityName,
      })),
    };
  }
}
