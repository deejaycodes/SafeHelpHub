import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './shemas/questions.schema';

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private questionModel: Model<Question>) {}

  async getAllQuestions(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async getAnswerForQuestion(questionId: string): Promise<Question> {
    return this.questionModel.findById(questionId).exec();
  }
}
