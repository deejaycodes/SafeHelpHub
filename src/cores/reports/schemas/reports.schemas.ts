import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { encrypt, decrypt } from 'src/common/utils/encryption';
import { ReportStatus } from 'src/common/enums/report-status.enum';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @ApiProperty({
    description: 'Type of the incident reported',
    example: 'harassment',
  })
  @IsString()
  @Prop({ required: true })
  incident_type: string;

  @ApiProperty({
    description: 'Description of the incident',
    example: 'Details of the incident',
  })
  @IsString()
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'Location where the incident occurred',
    example: 'Lagos, Nigeria',
  })
  @IsString()
  @Prop({ required: true })
  location: string;

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
  @IsEnum(ReportStatus) // Use the enum for validation
  @Prop({ enum: ReportStatus, default: ReportStatus.SUBMITTED }) // Use the enum in the Mongoose schema
  status: ReportStatus; // Change the type to the enum

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

  @Prop({ type: String, ref: 'User' })
  acceptedBy?: string; 

  @Prop({ type: [String], default: [] }) 
  ngo_dashboard_ids?: string[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);
