import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @ApiProperty({ description: 'Logged-in user ID', required: false })
  @Prop({ type: Types.ObjectId })
  userId?: string;

  @ApiProperty({ description: 'Anonymous session ID', required: false })
  @Prop({ type: String })
  sessionId?: string; 

  @ApiProperty({ description: 'Sender (user or customer service)', required: false})
  @Prop({ type: String })
  sender: string; 

  @ApiProperty({ description: 'The actual chat message', required: false })
  @Prop({type: String  })
  content: string; 
  
  @ApiProperty({ description: 'When the message expires', required: false })
  @Prop({ type: Date, default: Date.now, index: { expires: '5m' } })
  expiresAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
