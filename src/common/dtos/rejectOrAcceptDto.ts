import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class AcceptOrRejectReportDto {
  @ApiProperty({
    description: 'Action to either accept or reject the report',
    enum: ['accept', 'reject'],
    example: 'accept',
  })
  @IsEnum(['accept', 'reject'], { message: 'Action must be either "accept" or "reject"' })
  action: 'accept' | 'reject';
}
