import { BadRequestException } from '@nestjs/common';

export function parseAndValidateDate(
  dateStr: string,
  fieldName?: string,
): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new BadRequestException(
      `${fieldName ? fieldName : 'Ngày tháng'} không hợp lệ.`,
    );
  }

  return date;
}
