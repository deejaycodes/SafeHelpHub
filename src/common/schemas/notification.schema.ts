import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';


export type NotificationDocument = Notification & Document;
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({
    description: 'The NGO being notified about the report',
    type: String,
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @IsMongoId()
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  ngoId: Types.ObjectId;

  @ApiProperty({
    description: 'The report associated with the notification',
    type: String,
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @IsMongoId()
  @Prop({ required: true, type: Types.ObjectId, ref: 'Report' })
  reportId: Types.ObjectId;

  @ApiProperty({
    description: 'Notification message content',
    example: 'You have been assigned to handle report 60f6b3eaf6477d49f87e9c7f located in Lagos.',
  })
  @IsString()
  @Prop({ required: true })
  message: string;

  @ApiProperty({
    description: 'Status of the notification',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  @IsEnum(NotificationStatus)
  @Prop({ enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @ApiProperty({
    description: 'Timestamp when the notification was created',
    example: '2024-10-01T12:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the notification was last updated',
    example: '2024-10-01T12:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
