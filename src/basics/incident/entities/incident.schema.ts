import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type IncidentTypeDocument = IncidentType & Document;

@Schema({ timestamps: true })
export class IncidentType {
  @ApiProperty({
    description: 'Unique name of the incident type',
    example: 'harassment',
  })
  @Prop({ required: true, unique: true })
  name: string;

}

export const IncidentTypeSchema = SchemaFactory.createForClass(IncidentType);
