import { IsEnum, IsOptional, Matches } from 'class-validator';

export enum ReportGroupBy {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
}

export class ReportQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to: string;

  @IsOptional()
  @IsEnum(ReportGroupBy)
  groupBy: ReportGroupBy = ReportGroupBy.DAY;
}
