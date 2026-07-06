import { BadRequestException } from '@nestjs/common';
import { Booking } from '../../entities/booking.entity';

export function findOptimalCombinations(
  rooms: any[],
  totalGuests: number,
  limit = 5,
  maxRoomsPerCombination = 4,
): any[] {
  const candidateLimit = 100;
  const sorted = [...rooms].sort(
    (a, b) => a.roomType.maxOccupancy - b.roomType.maxOccupancy,
  );
  const results: any[][] = [];
  for (
    let size = 1;
    size <= Math.min(maxRoomsPerCombination, sorted.length);
    size++
  ) {
    combinationsOfSize(sorted, size, (combo) => {
      const totalCapacity = combo.reduce(
        (s, r) => s + r.roomType.maxOccupancy,
        0,
      );
      if (totalCapacity >= totalGuests) {
        results.push(combo);
      }
      return results.length >= candidateLimit;
    });
    if (results.length > 0) break;
  }
  return results
    .map((combo) => ({
      rooms: combo,
      totalCapacity: combo.reduce((s, r) => s + r.roomType.maxOccupancy, 0),
      proximityScore: calcProximityScore(combo),
      totalPrice: combo.reduce(
        (sum, r) => sum + (r.roomType.activePrice ?? 0),
        0,
      ),
    }))
    .sort((a, b) => {
      if (a.proximityScore !== b.proximityScore) {
        return a.proximityScore - b.proximityScore;
      }
      const excessA = a.totalCapacity - totalGuests;
      const excessB = b.totalCapacity - totalGuests;
      if (excessA !== excessB) {
        return excessA - excessB;
      }
      return a.totalPrice - b.totalPrice;
    })
    .slice(0, limit);
}

export function combinationsOfSize(
  arr: any[],
  size: number,
  callback: (combo: any[]) => boolean,
  start = 0,
  current: any[] = [],
): boolean {
  if (current.length === size) {
    return callback(current);
  }
  for (let i = start; i <= arr.length - (size - current.length); i++) {
    const shouldStop = combinationsOfSize(arr, size, callback, i + 1, [
      ...current,
      arr[i],
    ]);
    if (shouldStop) return true;
  }
  return false;
}

export function calcProximityScore(combo: any[]): number {
  if (combo.length === 1) return 0;
  const extractNum = (s: string) => {
    const match = s.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };
  let score = 0;
  for (let i = 0; i < combo.length - 1; i++) {
    for (let j = i + 1; j < combo.length; j++) {
      score += Math.abs(combo[i].floor - combo[j].floor) * 10;
      score += Math.abs(
        extractNum(combo[i].roomNumber) - extractNum(combo[j].roomNumber),
      );
    }
  }
  return score;
}

export function resolvePrice(pricePlans: any[]): number | null {
  const active = pricePlans?.find((p) => p.isActive);
  return active ? Number(active.basePrice) : null;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const toVNDate = (date: Date) => {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return new Date(
      vnTime.getUTCFullYear(),
      vnTime.getUTCMonth(),
      vnTime.getUTCDate(),
    );
  };
  const diffInMs = toVNDate(checkOut).getTime() - toVNDate(checkIn).getTime();
  const nights = diffInMs / (1000 * 60 * 60 * 24);
  if (nights <= 0)
    throw new BadRequestException('Ngày nhận/trả phòng không hợp lệ.');
  return nights;
}

export function formatBooking(booking: Booking) {
  return {
    bookingId: booking.bookingId,
    status: booking.status,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    actualCheckIn: booking.actualCheckIn,
    actualCheckOut: booking.actualCheckOut,
    guests: (booking.guests || []).map((g) => ({
      bookingGuestId: g.bookingGuestId,
      fullName: g.fullName,
      idNumber: g.idNumber,
      phone: g.phone,
      nationality: g.nationality,
      dateOfBirth: g.dateOfBirth,
    })),
    totalAmount: booking.totalAmount,
    serviceAmount: booking.serviceAmount,
    notes: booking.notes,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    vnpayTransactionId: booking.vnpayTransactionId,
    servicePaymentMethod: booking.servicePaymentMethod,
    servicePaymentStatus: booking.servicePaymentStatus,
    guestName: booking.guestName ?? null,
    guestPhone: booking.guestPhone ?? null,
    guestEmail: booking.guestEmail ?? null,
    customer: booking.customer
      ? {
          customerId: booking.customer.customerId,
          fullName: booking.customer.fullName,
        }
      : null,
    bookingDetails: (booking.bookingDetails || []).map((d) => ({
      bookingDetailId: d.bookingDetailId,
      priceAtBooking: d.priceAtBooking,
      room: d.room
        ? {
            roomId: d.room.roomId,
            roomNumber: d.room.roomNumber,
            floor: d.room.floor,
            status: d.room.status,
            roomType: d.room.roomType
              ? {
                  roomTypeId: d.room.roomType.roomTypeId,
                  typeName: d.room.roomType.typeName,
                  description: d.room.roomType.description,
                  maxOccupancy: d.room.roomType.maxOccupancy,
                  roomBeds: (d.room.roomType.roomTypeBed || []).map((b) => ({
                    roomBedId: b.roomBedId,
                    roomBedType: b.roomBed?.roomBedType,
                    capacity: b.roomBed?.capacity,
                    quantity: b.quantity,
                  })),
                  amenities: (d.room.roomType.roomTypeAmenities || []).map(
                    (a) => ({
                      roomAmenityId: a.roomAmenityId,
                      roomAmenityName: a.roomAmenity?.roomAmenityName,
                      category: a.roomAmenity?.category,
                    }),
                  ),
                  images: (d.room.roomType.roomImages || [])
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((img) => ({
                      roomImageId: img.roomImageId,
                      url: img.url,
                      altText: img.altText,
                      isCover: img.isCover,
                    })),
                  activePricePlan: (() => {
                    const active = (d.room.roomType.pricePlans || []).find(
                      (p) => p.isActive,
                    );
                    return active
                      ? {
                          pricePlanId: active.pricePlanId,
                          pricePlanName: active.pricePlanName,
                          type: active.type,
                          basePrice: active.basePrice,
                        }
                      : null;
                  })(),
                }
              : null,
          }
        : null,
      services: d.bookingServices.map((item) => {
        return {
          bookingServiceId: item.bookingServiceId,
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          unit: item.unit,
          priceAtUsage: item.priceAtUsage,
          quantity: item.quantity,
        };
      }),
    })),
    createdAt: booking.created_At,
    updatedAt: booking.updated_At,
  };
}
