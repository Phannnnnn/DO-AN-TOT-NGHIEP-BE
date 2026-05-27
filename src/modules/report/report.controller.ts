import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  getReport(@Query() query: ReportQueryDto) {
    return this.reportService.getReport(query);
  }
}
