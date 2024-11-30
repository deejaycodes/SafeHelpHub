import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Types } from 'mongoose';
import { ReportStatus } from 'src/common/enums/report-status.enum';


@Schema({ timestamps: true })
export class ReportAssignment {
  @ApiProperty({
    description: 'The NGO ID assigned to the report',
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ngoId: Types.ObjectId;

  @ApiProperty({
    description: 'The ID of the associated report',
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @Prop({ type: Types.ObjectId, ref: 'Report', required: true })
  reportId: Types.ObjectId;

  @ApiProperty({
    description: 'The current status of the report assignment',
    enum: ReportStatus,
    example: ReportStatus.ACCEPTED,
  })
  @IsEnum(ReportStatus)
  @Prop({ enum: ReportStatus, required: true })
  status: ReportStatus;

  @ApiProperty({
    description: 'Date when the report was assigned to the NGO',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;
}

export const ReportAssignmentSchema = SchemaFactory.createForClass(ReportAssignment);
