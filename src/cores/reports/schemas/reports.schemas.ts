import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { encrypt, decrypt } from 'src/common/utils/encryption';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {

  
  @ApiProperty({
    description: 'Reference to the incident type for the report',
    example: '63f7c1e8c839e4b8a2c8a921', 
    type: String, 
  })
  @Prop({ type: Types.ObjectId, ref: 'IncidentType', required: true })
  incident_type: Types.ObjectId;
  

  @ApiProperty({
    description: 'Description of the incident',
    example: 'Details of the incident',
  })
  @IsString()
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'Location where the incident occurred',
    example: 'Lagos',
    enum: NigerianStates,
  })
  @IsEnum(NigerianStates, { message: 'Location must be a valid Nigerian state' })
  @Prop({ required: true, enum: NigerianStates })
  location: NigerianStates;

  @ApiProperty({
    description: 'Encrypted contact info of the reporter',
    example: 'contact@example.com',
    required: false,
  })
  @IsOptional()
  @Prop({
    type: String,
    set: (value: string) => {
      try {
        return value ? encrypt(value) : null;
      } catch (error) {
        console.error('Encryption error:', error);
        return null;
      }
    },
    get: (value: string) => {
      try {
        return value ? decrypt(value) : null;
      } catch (error) {
        console.error('Decryption error:', error);
        return null;
      }
    },
  })
  contact_info?: string;

  @ApiProperty({
    description: 'Encrypted user ID who reported the incident',
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @IsString()
  @Prop({
    type: String,
    set: (value: string) => {
      try {
        return value ? encrypt(value) : null;
      } catch (error) {
        console.error('Encryption error:', error);
        return null;
      }
    },
    get: (value: string) => {
      try {
        return value ? decrypt(value) : null;
      } catch (error) {
        console.error('Decryption error:', error);
        return null;
      }
    },
  })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'List of files associated with the report',
    type: Array,
    example: [
      {
        file_path: 'uploads/report123.pdf',
        uploaded_at: '2023-09-12T14:48:00.000Z',
      },
    ],
  })
  @IsArray()
  @Prop({ type: Array })
  files: Array<{ file_path: string; uploaded_at: Date }>;

  @ApiProperty({
    description: 'Status of the report',
    enum: ReportStatus,
    default: ReportStatus.SUBMITTED,
  })
  @IsEnum(ReportStatus)
  @Prop({ enum: ReportStatus, default: ReportStatus.SUBMITTED })
  status: ReportStatus;
  @ApiProperty({
    description: 'Date when the report was created',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @ApiProperty({
    description: 'Date when the report was last updated',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updated_at: Date;

  @Prop({ type: [String], ref: 'User' })
  rejected_by?: string[];

  
  @Prop({ type: [String], ref: 'User' })
  accepted_by?: string[];

  @ApiProperty({
    description: 'Rejection reasons for the report, if any',
    type: Array,
    example: [
      {
        reason: 'Insufficient details',
        rejected_by: '60f6b3eaf6477d49f87e9c7f',
        rejected_at: '2024-10-01T12:00:00.000Z',
      },
    ],
  })
  @IsArray()
  @Prop({
    type: [
      {
        reason: { type: String, required: true },
        rejected_by: { type: Types.ObjectId, ref: 'User', required: true },
        rejected_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  rejection_reasons: Array<{
    reason: string;
    rejected_by: Types.ObjectId;
    rejected_at: Date;
  }>;

  @Prop({ type: [String], default: [] })
  ngo_dashboard_ids?: string[];

  @Prop({ type: Boolean, default: false })
 isProcessing?: boolean;

}

export const ReportSchema = SchemaFactory.createForClass(Report);
