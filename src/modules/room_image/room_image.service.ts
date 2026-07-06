import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomImage } from '../../entities/room-image.entity';
import { UpdateRoomImageDto } from './dto/update-room-image.dto';
@Injectable()
export class RoomImageService {
  constructor(
    @InjectRepository(RoomImage)
    private readonly roomImageRepository: Repository<RoomImage>,
  ) {}

  private nomalizeCover<T extends { isCover?: boolean }>(images: T[]): T[] {
    let coverAssigned = false;
    const normalized = images.map((img) => {
      if (img.isCover && !coverAssigned) {
        coverAssigned = true;
        return { ...img, isCover: true };
      }
      return { ...img, isCover: false };
    });

    if (!coverAssigned && images.length > 0) {
      normalized[0].isCover = true;
    }

    return normalized;
  }

  async saveImages(
    roomTypeId: number,
    createRoomImageDto: { url?: string; altText?: string; isCover?: boolean }[],
  ) {
    const nomalized = this.nomalizeCover(
      createRoomImageDto.filter((img) => img.url),
    );
    const entities = nomalized.map((img, index) =>
      this.roomImageRepository.create({
        roomTypeId: roomTypeId,
        url: img.url,
        sortOrder: index,
        altText: img.altText ?? undefined,
        isCover: img.isCover ?? false,
      }),
    );

    return this.roomImageRepository.save(entities);
  }

  async replaceImages(
    roomTypeId: number,
    updateRoomImageDto: UpdateRoomImageDto[],
  ) {
    await this.roomImageRepository.delete({ roomTypeId });
    if (!updateRoomImageDto.length) return [];

    return this.saveImages(roomTypeId, updateRoomImageDto);
  }
}
