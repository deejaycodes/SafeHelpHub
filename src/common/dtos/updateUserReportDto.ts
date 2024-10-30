import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReportStatus } from '../enums/report-status.enum';

export class UpdateReportDto {
  @ApiPropertyOptional({
    description: 'Status of the report (e.g., REJECTED, ACCEPTED, RESOLVED)',
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Reason for rejection if the report is being rejected',
    example: 'Incomplete information provided',
  })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
