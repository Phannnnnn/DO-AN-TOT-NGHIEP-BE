import {
  BadRequestException,
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
import { RoomStatus } from '../../common/enums/room-status.enum';
import { HousekeepingService } from '../housekeeping_task/housekeeping_task.service';
import {
  HousekeepingTask,
  HousekeepingTaskStatus,
} from '../../entities/housekeeping-task.entity';
import { BookingDetail } from '../../entities/booking-detail.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly roomTypeService: RoomTypeService,
    private readonly housekeepingService: HousekeepingService,
    @InjectRepository(HousekeepingTask)
    private readonly housekeepingTaskRepository: Repository<HousekeepingTask>,
    @InjectRepository(BookingDetail)
    private readonly bookingDetailRepository: Repository<BookingDetail>,
  ) {}
  private formatRoom(room: Room) {
    const activePlan = room.roomType.pricePlans.find((p) => p.isActive) ?? null;
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
    if (room.status === RoomStatus.CLEANING) {
      await this.housekeepingService.createTask(room.roomId);
    }
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

    const occupied = await this.bookingDetailRepository
      .createQueryBuilder('booking_detail')
      .innerJoin('booking_detail.booking', 'bookings')
      .where('booking_detail.roomId = :roomId', { roomId })
      .andWhere('bookings.status = :status', {
        status: BookingStatus.CONFIRMED,
      })
      .andWhere('bookings.actualCheckIn IS NOT NULL')
      .andWhere('bookings.actualCheckOut IS NULL')
      .getOne();

    if (occupied) {
      throw new BadRequestException('Không thể cập nhật phòng đang sử dụng.');
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
    if (
      (updateRoomDto.status && room.status === RoomStatus.CLEANING) ||
      room.status === RoomStatus.PROGRESS
    ) {
      await this.housekeepingService.getActiveTask(roomId);
    }
    Object.assign(room, updateRoomDto);
    await this.roomRepository.save(room);
    if (updateRoomDto.status === RoomStatus.CLEANING) {
      await this.housekeepingService.createTask(roomId);
    }
    return this.roomById(roomId);
  }

  async updateStatus(roomId: number, updateStatusRoom: UpdateStatusRoomDto) {
    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trên hệ thống.');
    }
    console.log(room.status);
    if (
      room.status === RoomStatus.CLEANING ||
      room.status === RoomStatus.PROGRESS
    ) {
      await this.housekeepingService.getActiveTask(roomId);
    }
    room.status = updateStatusRoom.status;
    await this.roomRepository.save(room);
    if (updateStatusRoom.status === RoomStatus.CLEANING) {
      await this.housekeepingService.createTask(roomId);
    }
    return this.roomById(roomId);
  }
  async remove(roomId: number) {
    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room) {
      throw new NotFoundException('Phòng này không tồn tại trên hệ thống.');
    }

    const bookingDetailExits = await this.bookingDetailRepository.exists({
      where: { roomId },
    });

    if (bookingDetailExits) {
      throw new BadRequestException('Không thể xóa phòng đã được sử dụng.');
    }

    const housekeepingTaskExits = await this.housekeepingTaskRepository.findOne(
      {
        where: { roomId, status: HousekeepingTaskStatus.IN_PROGRESS },
      },
    );

    if (housekeepingTaskExits) {
      throw new BadRequestException('Không thể xóa phòng đã được sử dụng.');
    }

    const data = await this.roomById(roomId);
    await this.roomRepository.remove(room);
    return data;
  }
}
