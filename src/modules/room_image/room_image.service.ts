import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomImage } from '../../entities/room-image.entity';

@Injectable()
export class RoomImageService {
  constructor(
    @InjectRepository(RoomImage)
    private readonly roomImageRepository: Repository<RoomImage>,
  ) {}

  async saveImages(
    roomTypeId: number,
    images: { url?: string; altText?: string; isCover?: boolean }[],
  ) {
    let coverAssigned = false;
    const entities = images
      .filter((img) => img.url)
      .map((img, index) => {
        const isCover =
          img.isCover && !coverAssigned
            ? ((coverAssigned = true), true)
            : false;
        return this.roomImageRepository.create({
          roomType: { roomTypeId },
          url: img.url,
          altText: img.altText ?? undefined,
          isCover,
          sortOrder: index,
        });
      });
    return this.roomImageRepository.save(entities);
  }

  async replaceImages(
    roomTypeId: number,
    images: { url?: string; altText?: string; isCover?: boolean }[],
  ) {
    await this.roomImageRepository.delete({ roomTypeId });
    if (!images.length) return [];

    // Đảm bảo chỉ 1 ảnh bìa — ưu tiên ảnh đầu tiên có isCover = true
    let coverAssigned = false;
    const normalized = images.map((img) => {
      if (img.isCover && !coverAssigned) {
        coverAssigned = true;
        return { ...img, isCover: true };
      }
      return { ...img, isCover: false };
    });

    return this.saveImages(roomTypeId, normalized);
  }
}
