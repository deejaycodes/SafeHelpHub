import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { encrypt, decrypt } from 'src/utils/encryption';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true })
  incident_type: string;  

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

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

 @Prop({ type: Array })
  files: Array<{ file_path: string; uploaded_at: Date }>;

  @Prop({ enum: ['submitted', 'in review', 'resolved'], default: 'submitted' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
