import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoomHold } from '../../entities/room-hold.entity';
import { CreateRoomHoldDto } from './dto/create-room-hold.dto';
import { randomUUID } from 'crypto';
import { Room } from '../../entities/room.entity';
import { RoomStatus } from '../../common/enums/room-status.enum';
const HOLD_MINUTES = Number(process.env.HOLD_MINUTES) || 15;
@Injectable()
export class RoomHoldService {
  constructor(
    @InjectRepository(RoomHold)
    private readonly roomHoldRepository: Repository<RoomHold>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async hold(dto: CreateRoomHoldDto): Promise<{
    sessionId: string;
    expiresAt: Date;
  }> {
    const now = new Date();
    for (const roomId of dto.roomIds) {
      const room = await this.roomRepository.findOne({
        where: { roomId: roomId },
      });

      if (!room) {
        throw new NotFoundException(
          'Phòng đang giữ không tồn tại trên hệ thống.',
        );
      }

      if (room.status === RoomStatus.MAINTENANCE) {
        throw new BadRequestException('Phòng đang giữ đang không sẵn sàng.');
      }

      const conflict = await this.roomHoldRepository
        .createQueryBuilder('h')
        .where('h.roomId = :roomId', { roomId })
        .andWhere('h.expiresAt > :now', { now })
        .andWhere('h.checkInDate < :checkOut', { checkOut: dto.checkOutDate })
        .andWhere('h.checkOutDate > :checkIn', { checkIn: dto.checkInDate })
        .getOne();
      if (conflict) {
        throw new ConflictException(
          `Phòng ${roomId} đang được giữ bởi người dùng khác trong khoảng thời gian này. Vui lòng thử lại sau.`,
        );
      }
    }
    const sessionId = randomUUID();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
    const holds = dto.roomIds.map((roomId) =>
      this.roomHoldRepository.create({
        roomId,
        sessionId,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        expiresAt,
      }),
    );
    await this.roomHoldRepository.save(holds);
    return { sessionId, expiresAt };
  }

  async release(sessionId: string): Promise<void> {
    const holds = await this.roomHoldRepository.find({
      where: { sessionId },
    });
    if (!holds.length) throw new NotFoundException('Session không tồn tại.');
    await this.roomHoldRepository.remove(holds);
  }

  async isValidSession(
    sessionId: string,
    roomIds: number[],
    checkInDate: string,
    checkOutDate: string,
  ): Promise<boolean> {
    const now = new Date();
    for (const roomId of roomIds) {
      const hold = await this.roomHoldRepository
        .createQueryBuilder('h')
        .where('h.roomId = :roomId', { roomId })
        .andWhere('h.sessionId = :sessionId', { sessionId })
        .andWhere('h.checkInDate = :checkInDate', { checkInDate })
        .andWhere('h.checkOutDate = :checkOutDate', { checkOutDate })
        .andWhere('h.expiresAt > :now', { now })
        .getOne();
      if (!hold) return false;
    }
    return true;
  }

  async getHeldRoomIds(
    checkInDate: string,
    checkOutDate: string,
  ): Promise<number[]> {
    const now = new Date();
    const holds = await this.roomHoldRepository
      .createQueryBuilder('h')
      .where('h.expiresAt > :now', { now })
      .andWhere('h.checkInDate < :checkOut', { checkOut: checkOutDate })
      .andWhere('h.checkOutDate > :checkIn', { checkIn: checkInDate })
      .getMany();
    return [...new Set(holds.map((h) => h.roomId))];
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpired(): Promise<void> {
    await this.roomHoldRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
