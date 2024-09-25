import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Question } from './shemas/questions.schema';

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private questionModel: Model<Question>) {}

  async getAllQuestions(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async getAnswerForQuestion(questionId: string): Promise<Question> {
    if (!isValidObjectId(questionId)) {
      throw new BadRequestException('Invalid ID format. Must be a 24-character hex string.');
    }
    const objectId =
    typeof questionId === 'string' ? new Types.ObjectId(questionId) : questionId;
    const question = await this.questionModel.findById(objectId).exec();
    if (!question) {
      throw new NotFoundException(`Report ${questionId} not found`);
    }
    return question
  }
}
