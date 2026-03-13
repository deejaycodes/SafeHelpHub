import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TransitionReportDto {
  @ApiProperty({ description: 'Workflow event: REVIEW, ACCEPT, PUT_ON_HOLD, RESUME, RESOLVE, REFER, CLOSE, REOPEN', example: 'ACCEPT' })
  @IsString()
  event: string;

  @ApiPropertyOptional({ description: 'Reason (required for PUT_ON_HOLD, REFER, CLOSE)', example: 'Not our specialization' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Status of the report' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection/referral' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
