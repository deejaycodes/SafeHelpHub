import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './shemas/chats.schema';


@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async saveMessage(messageData: Partial<ChatMessage>) {
    const createdMessage =  new this.chatMessageModel(messageData);
    return await createdMessage.save();
  }
  

  async getMessages(userId: string | null, sessionId: string | null): Promise<ChatMessage[]> {
    return this.chatMessageModel.find(userId ? { userId } : { sessionId }).exec();
  }
}
