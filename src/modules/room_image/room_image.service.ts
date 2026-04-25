import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RoomImage } from '../../entities/room-image.entity';
import { RoomTypeService } from '../room_type/room_type.service';
import { CreateRoomImageDto } from './dto/create-room-image.dto';
import { UpdateRoomImageDto } from './dto/update-room-image.dto';

@Injectable()
export class RoomImageService {
  constructor(
    @InjectRepository(RoomImage)
    private readonly roomImageRepository: Repository<RoomImage>,
    private readonly roomTypeService: RoomTypeService,
  ) {}

  async create(createRoomImageDto: CreateRoomImageDto): Promise<RoomImage> {
    await this.roomTypeService.roomTypeById(createRoomImageDto.roomTypeId);

    // Nếu không nhập sortOrder thì tự động lấy max + 1
    if (createRoomImageDto.sortOrder === undefined) {
      const maxSortOrder = await this.roomImageRepository.maximum('sortOrder', {
        roomTypeId: createRoomImageDto.roomTypeId,
      });
      createRoomImageDto.sortOrder =
        maxSortOrder !== null ? maxSortOrder + 1 : 0;
    } else {
      // Kiểm tra sortOrder có bị trùng không
      const conflictImage = await this.roomImageRepository.findOne({
        where: {
          roomTypeId: createRoomImageDto.roomTypeId,
          sortOrder: createRoomImageDto.sortOrder,
        },
      });
      if (conflictImage) {
        // Hoán đổi — ảnh cũ lấy max + 1 tạm thời
        const maxSortOrder = await this.roomImageRepository.maximum(
          'sortOrder',
          {
            roomTypeId: createRoomImageDto.roomTypeId,
          },
        );
        conflictImage.sortOrder = (maxSortOrder ?? 0) + 1;
        await this.roomImageRepository.save(conflictImage);
      }
    }

    const oldCover = await this.roomImageRepository.findOne({
      where: {
        roomTypeId: createRoomImageDto.roomTypeId,
        isCover: true,
      },
    });

    if (!oldCover) {
      // Chưa có ảnh bìa → ảnh mới tự động là ảnh bìa
      createRoomImageDto.isCover = true;
    } else if (createRoomImageDto.isCover) {
      // Đã có ảnh bìa nhưng ảnh mới muốn làm bìa → thay thế
      oldCover.isCover = false;
      await this.roomImageRepository.save(oldCover);
    }

    const roomImage = this.roomImageRepository.create(createRoomImageDto);
    return this.roomImageRepository.save(roomImage);
  }

  async roomImages(roomTypeId: number): Promise<RoomImage[]> {
    await this.roomTypeService.roomTypeById(roomTypeId);
    return this.roomImageRepository.find({
      where: { roomTypeId },
      order: { sortOrder: 'ASC' },
    });
  }

  async roomImageById(roomImageId: number): Promise<RoomImage> {
    const roomImage = await this.roomImageRepository.findOne({
      where: { roomImageId },
    });
    if (!roomImage) {
      throw new NotFoundException('Ảnh không tồn tại trên hệ thống.');
    }
    return roomImage;
  }

  async update(
    roomImageId: number,
    updateRoomImageDto: UpdateRoomImageDto,
  ): Promise<RoomImage> {
    const roomImage = await this.roomImageById(roomImageId);

    const conflictSortOrDer = await this.roomImageRepository.findOne({
      where: {
        sortOrder: updateRoomImageDto.sortOrder,
        roomTypeId: roomImage.roomTypeId,
        roomImageId: Not(roomImageId),
      },
    });

    if (conflictSortOrDer) {
      const maxSortOrder = await this.roomImageRepository.maximum('sortOrder', {
        roomTypeId: roomImage.roomTypeId,
      });
      conflictSortOrDer.sortOrder = maxSortOrder ? maxSortOrder + 1 : 0;
      await this.roomImageRepository.save(conflictSortOrDer);
    }

    if (updateRoomImageDto.isCover && !roomImage.isCover) {
      const oldCover = await this.roomImageRepository.findOne({
        where: {
          roomTypeId: roomImage.roomTypeId,
          isCover: true,
        },
      });

      if (oldCover) {
        oldCover.isCover = false;
        await this.roomImageRepository.save(oldCover);
      }
    }

    Object.assign(roomImage, updateRoomImageDto);
    return this.roomImageRepository.save(roomImage);
  }

  async remove(roomImageId: number): Promise<RoomImage> {
    const roomImage = await this.roomImageById(roomImageId);
    return this.roomImageRepository.remove(roomImage);
  }
}
