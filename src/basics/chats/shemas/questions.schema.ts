import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Question extends Document {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// src/schemas/specialist-request.schema.ts
@Schema()
export class SpecialistRequest extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  requestId: string;

  @Prop({ default: Date.now })
  requestedAt: Date;
}

export const SpecialistRequestSchema = SchemaFactory.createForClass(SpecialistRequest);
