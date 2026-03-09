import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Question } from './shemas/questions.schema';
import { AIChatbotService } from './ai-chatbot.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    private readonly aiChatbotService: AIChatbotService,
  ) {}

  async getAllQuestions(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async getAnswerForQuestion(questionId: string): Promise<Question> {
    if (!isValidObjectId(questionId)) {
      throw new BadRequestException(
        'Invalid ID format. Must be a 24-character hex string.',
      );
    }
    const objectId =
      typeof questionId === 'string'
        ? new Types.ObjectId(questionId)
        : questionId;
    const question = await this.questionModel.findById(objectId).exec();
    if (!question) {
      throw new NotFoundException(`Report ${questionId} not found`);
    }
    return question;
  }

  async askAIChatbot(userMessage: string): Promise<{ response: string }> {
    const aiResponse = await this.aiChatbotService.generateResponse(userMessage);
    return { response: aiResponse };
  }
}
